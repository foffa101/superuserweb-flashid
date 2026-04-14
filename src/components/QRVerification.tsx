import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firestore';
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
} from 'lucide-react';



interface QRVerificationProps {
  userId: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function QRVerification({ userId, onVerified, onCancel }: QRVerificationProps) {
  const [currentSessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [status, setStatus] = useState<AuthSession['status']>('pending');
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [scanned, setScanned] = useState(false);
  const [challengePassed, setChallengePassed] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [honeypotValue, setHoneypotValue] = useState('');
  const [biometricsRequired, setBiometricsRequired] = useState(false);
  const [challengeRequired, setChallengeRequired] = useState(false);

  const unsubRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleCancel = useCallback(() => {
    // Deny the session in Firestore so the phone detects it
    if (currentSessionId) {
      updateDoc(doc(db, 'auth_sessions', currentSessionId), { status: 'denied' }).catch(() => {});
    }
    if (unsubRef.current) unsubRef.current();
    if (timerRef.current) clearInterval(timerRef.current);
    onCancel();
  }, [currentSessionId, onCancel]);
  const qrTimeoutRef = useRef(90);

  const startSession = useCallback(async () => {
    // Honeypot check — if filled by bot, silently bail
    if (honeypotValue) return;

    unsubRef.current?.();
    if (timerRef.current) clearInterval(timerRef.current);

    // Full state reset (prevents stale data from previous session)
    setIsCreating(true);
    setError(null);
    setStatus('pending');
    setScanned(false);
    setChallengePassed(false);
    setChallengeData(null);
    setBiometricsRequired(false);
    setChallengeRequired(false);

    // Rate limit — cooldown prevents rapid session spam
    setCooldown(true);
    setTimeout(() => setCooldown(false), 3000);

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
      const timeout = result.qrTimeout || 90;
      qrTimeoutRef.current = timeout;
      setSessionId(result.sessionId);
      setQrUrl(result.qrUrl);
      setSecondsLeft(timeout);

      const start = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const remaining = Math.max(0, timeout - elapsed);
        setSecondsLeft(remaining);
        if (remaining === 0) {
          setStatus('expired');
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 250);

      unsubRef.current = subscribeToSession(result.sessionId, (session) => {
        if (!session) return;
        if (session.challenge_data) setChallengeData(session.challenge_data);
        setChallengeRequired(!!session.challenge_data);
        setBiometricsRequired(!!session.biometricsRequired);
        if (session.scanned || session.uid || session.challenge_response) setScanned(true);
        if (session.challenge_passed) setChallengePassed(true);

        // Server-side expiry sync — keep client timer aligned with Firestore truth
        if (session.expiresAt) {
          const serverRemaining = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
          setSecondsLeft((prev) => Math.min(prev, serverRemaining));
        }

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

  // Clean up session on tab close — mark as denied so phone stops waiting
  useEffect(() => {
    const cleanup = () => {
      if (currentSessionId && status === 'pending') {
        updateDoc(doc(db, 'auth_sessions', currentSessionId), { status: 'denied' }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, [currentSessionId, status]);

  // Auto-redirect on approval
  useEffect(() => {
    if (status === 'approved') {
      const timeout = setTimeout(() => onVerified(), 2000);
      return () => clearTimeout(timeout);
    }
  }, [status, onVerified]);

  const qrImageUrl = qrUrl
    ? `https://quickchart.io/qr?text=${encodeURIComponent(qrUrl)}&size=300&margin=2&ecLevel=H`
    : '';

  const progress = secondsLeft / qrTimeoutRef.current;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 text-center space-y-6">
        {/* Flash ID logo — colorful fingerprint + voice waves */}
        <div className="flex flex-col items-center gap-2">
          <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
            <path d="M24 4C16 4 10 10 10 18c0 5 2 8 4 10.5" stroke="#E040FB" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M24 4c8 0 14 6 14 14 0 5-2 8-4 10.5" stroke="#E040FB" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M24 8c-5.5 0-10 4.5-10 10 0 3.5 1.5 6 3 8" stroke="#E040FB" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M24 8c5.5 0 10 4.5 10 10 0 3.5-1.5 6-3 8" stroke="#E040FB" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M24 12c-3.5 0-6 2.5-6 6s1 4.5 2 6" stroke="#E040FB" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M24 12c3.5 0 6 2.5 6 6s-1 4.5-2 6" stroke="#E040FB" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M24 16c-1.5 0-2.5 1-2.5 2.5S23 21 24 22" stroke="#E040FB" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M24 16c1.5 0 2.5 1 2.5 2.5S25 21 24 22" stroke="#E040FB" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M16 36c0-3 3.5-5 8-5s8 2 8 5" stroke="#00E5FF" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M19 39c0-2 2.2-3.5 5-3.5s5 1.5 5 3.5" stroke="#00E5FF" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M22 42c0-1 0.9-1.5 2-1.5s2 0.5 2 1.5" stroke="#00E5FF" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <h1 className="text-3xl font-bold text-slate-900 tracking-wide">
            Flash <span className="text-blue-600">ID</span>
          </h1>
          <p className="text-slate-500 text-base">
            {!scanned
              ? 'Scan with your Flash ID app to log in'
              : challengeRequired && !challengePassed
                ? 'Complete the following Challenge Verification'
                : biometricsRequired
                  ? 'Complete Biometrics Verification on App'
                  : 'Confirm in your Flash ID app'}
          </p>
        </div>

        {/* --- PENDING --- */}
        {status === 'pending' && !isCreating && (
          <div className="space-y-5">

            {/* Status pill — background acts as countdown timer */}
            <div className="flex justify-center">
              <div className="relative w-[280px] h-10 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-blue-100 rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
                <div className="relative z-10 flex items-center justify-center gap-2 h-full text-slate-700">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-base font-medium">
                    {!scanned
                      ? 'Waiting for Scan...'
                      : challengeRequired && !challengePassed
                        ? 'Verifying Challenge on App...'
                        : biometricsRequired
                          ? 'Waiting for biometric verification...'
                          : 'Waiting for confirmation...'}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code — hidden after scan, replaced by challenge */}
            {!scanned ? (
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
            ) : challengeRequired && !challengePassed ? (
              <>
                {challengeData && <ChallengeDisplay challengeData={challengeData} />}
              </>
            ) : biometricsRequired ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <Fingerprint className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Biometric Verification</h3>
                  <p className="text-sm text-slate-500">Complete biometric verification on your Flash ID app</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Quick Confirm</h3>
                  <p className="text-sm text-slate-500">Tap approve in the Flash ID app to continue</p>
                </div>
              </div>
            )}

            {/* Countdown — plain text */}
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Clock className="w-4 h-4" />
              <span className="text-base font-medium">
                Expires in <span className="font-bold text-slate-900">{secondsLeft}s</span>
              </span>
            </div>

            {/* Cancel */}
            <button
              onClick={handleCancel}
              className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>

          </div>
        )}

        {/* --- CREATING — full-layout skeleton so card doesn't resize --- */}
        {isCreating && (
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="flex items-center justify-center gap-2 bg-blue-100 text-slate-700 rounded-full py-2 px-4 w-[280px]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-base font-medium">Creating secure session...</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-lg">
                <div className="w-[280px] h-[280px] rounded-lg bg-slate-50 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-base font-medium">Preparing...</span>
            </div>
            <div className="h-12" />
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
            <p className="text-slate-500 text-sm">The request was denied on your device.</p>
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 rounded-full">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Verification Denied</h2>
            {error && <p className="text-red-600 font-medium text-sm">{error}</p>}
            <button
              onClick={handleCancel}
              className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
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
              disabled={cooldown}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-5 h-5" />
              Regenerate QR Code
            </button>
            <button
              onClick={handleCancel}
              className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Honeypot — hidden from humans, filled by bots */}
        <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
          <label htmlFor="fid_website">Website</label>
          <input type="text" id="fid_website" name="fid_website" tabIndex={-1} autoComplete="off" value={honeypotValue} onChange={(e) => setHoneypotValue(e.target.value)} />
        </div>

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
