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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
              <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2" />
              <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
              <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
              <path d="M8.65 22c.21-.66.45-1.32.57-2" />
              <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
              <path d="M2 16h.01" />
              <path d="M21.8 16c.2-2 .131-5.354 0-6" />
              <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Flash ID'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Flash ID Internal Super Admin Portal
        </p>
      </div>
    </div>
  );
}
