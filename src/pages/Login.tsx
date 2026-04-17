import { useState } from 'react';
import { Fingerprint, ShieldCheck, Lock } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-red-600 p-3 rounded-xl mb-4">
              <Fingerprint className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Flash ID Super Admin</h1>
            <p className="text-sm text-slate-500 mt-1">Internal platform management</p>
          </div>

          <div className="flex justify-center">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-[13px] text-base font-semibold text-gray-200 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '-20px 0 40px rgba(0, 229, 255, 0.3), 20px 0 40px rgba(224, 64, 251, 0.3), 0 0 20px rgba(0, 229, 255, 0.1), 0 0 20px rgba(224, 64, 251, 0.1)',
              letterSpacing: '0.5px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
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
            {loading ? 'Signing in...' : 'Sign in with Flash ID'}
          </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Secure / Encrypted trust pills */}
        <div className="pt-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <ShieldCheck className="w-4 h-4" /> Secure
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            <Lock className="w-4 h-4" /> Encrypted
          </div>
        </div>

        {/* Don't have the app? */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs font-medium whitespace-nowrap">Don't have the app?</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="flex gap-2 items-center justify-center">
            <a href="https://play.google.com/store/apps/details?id=com.flashid.app" target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
              <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="h-10 sm:h-[72px] w-auto" />
            </a>
            <a href="https://apps.apple.com/app/flashid" target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
              <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" className="h-10 sm:h-12 w-auto" />
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Flash ID Internal Super Admin Portal
        </p>
      </div>
    </div>
  );
}
