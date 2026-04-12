import { useState, useEffect, useRef, useCallback } from 'react';
import { createSession, subscribeToSession } from '../lib/sessions';
import type { AuthSession } from '../lib/sessions';
import { ChallengeDisplay } from './ChallengeDisplay';
import type { ChallengeData } from '../lib/challenges';
import {
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Fingerprint,
  Smartphone,
} from 'lucide-react';

const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.flashid.app';
const IOS_URL = 'https://apps.apple.com/app/flashid';

type DownloadView = 'none' | 'android' | 'ios';

interface QRVerificationProps {
  userId: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function QRVerification({ userId, onVerified, onCancel }: QRVerificationProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [status, setStatus] = useState<AuthSession['status']>('pending');
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [downloadView, setDownloadView] = useState<DownloadView>('none');

  const unsubRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSession = useCallback(async () => {
    unsubRef.current?.();
    if (timerRef.current) clearInterval(timerRef.current);

    setIsCreating(true);
    setError(null);
    setStatus('pending');
    setSecondsLeft(90);
    setDownloadView('none');

    try {
      const biometrics = {
        face: localStorage.getItem('superadmin-require-face') === '1',
        fingerprint: localStorage.getItem('superadmin-require-fingerprint') === '1',
        voice: localStorage.getItem('superadmin-require-voice') === '1',
      };
      let verificationMethod: string | undefined;
      try {
        const methods = JSON.parse(localStorage.getItem('superadmin-verification-methods') || '{}');
        const enabled = Object.keys(methods).filter(k => methods[k]);
        if (enabled.length > 0) {
          verificationMethod = enabled.length === 1 ? enabled[0] : enabled[Math.floor(Math.random() * enabled.length)];
          if (verificationMethod === 'random') verificationMethod = 'random';
        }
      } catch {}
      const result = await createSession(userId, verificationMethod, biometrics);
      setSessionId(result.sessionId);
      setQrUrl(result.qrUrl);

      const start = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const remaining = Math.max(0, 90 - elapsed);
        setSecondsLeft(remaining);
        if (remaining === 0) {
          setStatus('expired');
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 250);

      unsubRef.current = subscribeToSession(result.sessionId, (session) => {
        if (!session) return;
        if (session.challenge_data) setChallengeData(session.challenge_data);
        if (session.status === 'approved') {
          if (session.uid && session.uid !== userId) {
            setError('Verification failed: approver identity mismatch. Please try again with the correct account.');
            setStatus('denied');
            if (timerRef.current) clearInterval(timerRef.current);
            return;
          }
        }
        setStatus(session.status);
        if (session.status === 'approved' || session.status === 'denied') {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      });
    } catch (err) {
      console.error('Failed to create session:', err);
      setError('Failed to create verification session. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [userId]);

  useEffect(() => {
    startSession();
    return () => {
      unsubRef.current?.();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startSession]);

  // Auto-redirect on approval
  useEffect(() => {
    if (status === 'approved') {
      const timeout = setTimeout(() => onVerified(), 1200);
      return () => clearTimeout(timeout);
    }
  }, [status, onVerified]);

  const qrImageUrl = qrUrl
    ? `https://quickchart.io/qr?text=${encodeURIComponent(qrUrl)}&size=300&margin=2&ecLevel=H`
    : '';

  const progress = secondsLeft / 90;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 text-center space-y-6">
        {/* Logo — red theme for super admin */}
        <div className="flex justify-center">
          <div className="p-4 bg-red-600 rounded-2xl shadow-xl">
            <Fingerprint className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* --- PENDING --- */}
        {status === 'pending' && !isCreating && downloadView === 'none' && (
          <div className="space-y-5">
            {/* Download app buttons */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Don't have the app?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDownloadView('android');
                    if (timerRef.current) clearInterval(timerRef.current);
                    unsubRef.current?.();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.454 1.42a1 1 0 010 1.735l-2.454 1.42-2.537-2.537 2.537-2.038zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                  </svg>
                  Android
                </button>
                <button
                  onClick={() => {
                    setDownloadView('ios');
                    if (timerRef.current) clearInterval(timerRef.current);
                    unsubRef.current?.();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-900 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  iOS
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Verify Your Identity</h2>
              <p className="text-slate-500 text-sm">
                Scan this QR code with your Flash ID app
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="relative p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-lg">
                {qrImageUrl && (
                  <img
                    src={qrImageUrl}
                    alt="Verification QR Code"
                    className="w-[280px] h-[280px] rounded-lg"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                    <QrCode className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Expires in <span className="font-bold text-slate-900">{secondsLeft}s</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            {/* Challenge display */}
            {challengeData && <ChallengeDisplay challengeData={challengeData} />}

            {/* Waiting indicator */}
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Waiting for verification...</span>
            </div>

            {/* Cancel */}
            <button
              onClick={onCancel}
              className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* --- DOWNLOAD APP --- */}
        {status === 'pending' && !isCreating && downloadView !== 'none' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Download Flash ID</h2>
              <p className="text-slate-500 text-sm">
                Scan with your phone camera to download for {downloadView === 'android' ? 'Android' : 'iOS'}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="relative p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-lg">
                <img
                  src={`https://quickchart.io/qr?text=${encodeURIComponent(downloadView === 'android' ? ANDROID_URL : IOS_URL)}&size=300&margin=2&ecLevel=H`}
                  alt={`Download for ${downloadView === 'android' ? 'Android' : 'iOS'}`}
                  className="w-[280px] h-[280px] rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                    <Smartphone className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setDownloadView(downloadView === 'android' ? 'ios' : 'android')}
              className="text-xs text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              Switch to {downloadView === 'android' ? 'iOS' : 'Android'}
            </button>

            <button
              onClick={() => {
                setDownloadView('none');
                startSession();
              }}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              I have the app — Log in
            </button>

            <button
              onClick={onCancel}
              className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* --- CREATING --- */}
        {isCreating && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <p className="text-slate-500 font-medium">Creating secure session...</p>
          </div>
        )}

        {/* --- APPROVED --- */}
        {status === 'approved' && (
          <div className="py-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Identity Verified</h2>
            <p className="text-slate-500 text-sm">Redirecting to the super admin portal...</p>
            <Loader2 className="w-5 h-5 text-green-600 animate-spin mx-auto" />
          </div>
        )}

        {/* --- DENIED --- */}
        {status === 'denied' && (
          <div className="py-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 rounded-full">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Verification Denied</h2>
            <p className="text-slate-500 text-sm">The request was denied on your device.</p>
            {error && <p className="text-red-600 font-medium text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={startSession}
                className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* --- EXPIRED --- */}
        {status === 'expired' && (
          <div className="py-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-amber-100 rounded-full">
                <Clock className="w-12 h-12 text-amber-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Session Expired</h2>
            <p className="text-slate-500 text-sm">The QR code has expired. Generate a new one to continue.</p>
            <button
              onClick={startSession}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Regenerate QR Code
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* --- ERROR (standalone) --- */}
        {error && status !== 'denied' && (
          <div className="py-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 rounded-full">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <p className="text-red-600 font-medium text-sm">{error}</p>
            <button
              onClick={startSession}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
