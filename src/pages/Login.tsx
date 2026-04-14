import { useState } from 'react';
import { Fingerprint } from 'lucide-react';
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

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-gray-200 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '-20px 0 40px rgba(0, 229, 255, 0.3), 20px 0 40px rgba(224, 64, 251, 0.3), 0 0 20px rgba(0, 229, 255, 0.1), 0 0 20px rgba(224, 64, 251, 0.1)',
              letterSpacing: '0.5px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
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

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Don't have the app? */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs font-medium whitespace-nowrap">Don't have the app?</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="flex gap-3">
            <a href="https://play.google.com/store/apps/details?id=com.flashid.app" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <svg className="w-6 h-6 text-slate-900 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.454 1.42a1 1 0 010 1.735l-2.454 1.42-2.537-2.537 2.537-2.038zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" /></svg>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 leading-tight">Get it on</div>
                <div className="text-sm font-bold text-slate-900 leading-tight">Google Play</div>
              </div>
            </a>
            <a href="https://apps.apple.com/app/flashid" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <svg className="w-6 h-6 text-slate-900 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 leading-tight">Download on the</div>
                <div className="text-sm font-bold text-slate-900 leading-tight">App Store</div>
              </div>
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
