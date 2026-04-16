import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthChange, signOut, type User } from './lib/firebase';
import { isEmailWhitelisted } from './lib/whitelist';
import { ShieldX } from 'lucide-react';
import { FilterProvider } from './lib/FilterContext';
import { QRVerification } from './components/QRVerification';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Security from './pages/Security';
import Events from './pages/Events';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import ConsentLog from './pages/ConsentLog';
import Documentation from './pages/Documentation';
import FieldAgents from './pages/agents/FieldAgents';
import BusinessAgents from './pages/agents/BusinessAgents';
import VerificationQueue from './pages/agents/VerificationQueue';

type AccessStatus = 'checking' | 'granted' | 'denied';

function ProtectedRoute({ user, children }: { user: User | null; children: React.ReactNode }) {
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('checking');
  const [isQrVerified, setIsQrVerified] = useState(() => {
    const level = localStorage.getItem('superadmin-security-level') || 'secure';
    if (level === 'most-secure') return false;
    if (level === 'secure') return sessionStorage.getItem('superadmin-qr-verified') === '1';
    if (level === 'more-secure') {
      const ts = localStorage.getItem('superadmin-qr-verified-at');
      if (!ts) return false;
      const timeout = localStorage.getItem('superadmin-session-timeout') || '4h';
      const ms: Record<string, number> = { '5m': 300000, '15m': 900000, '30m': 1800000, '1h': 3600000, '2h': 7200000, '4h': 14400000, '8h': 28800000, '12h': 43200000, '18h': 64800000, '24h': 86400000, 'never': Infinity };
      return Date.now() - parseInt(ts) < (ms[timeout] || 14400000);
    }
    return false;
  });

  // Apply saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('superadmin-theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Session timeout — auto-logout after inactivity
  useEffect(() => {
    if (!user || accessStatus !== 'granted') return;

    const timeoutValue = localStorage.getItem('superadmin-session-timeout') || '4h';
    if (timeoutValue === 'never') return;

    const timeoutMs: Record<string, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '8h': 8 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '18h': 18 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };

    const duration = timeoutMs[timeoutValue] || timeoutMs['4h'];
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await signOut();
      }, duration);
    };

    // Reset on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user, accessStatus]);

  const checkAccess = useCallback(async (u: User) => {
    setAccessStatus('checking');
    const email = u.email;
    if (!email) {
      setAccessStatus('denied');
      return;
    }
    const allowed = await isEmailWhitelisted(email);
    setAccessStatus(allowed ? 'granted' : 'denied');

    if (!allowed) {
      setTimeout(async () => {
        await signOut();
      }, 5000);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        checkAccess(u);
      } else {
        setAccessStatus('checking');
        setIsQrVerified(false);
      }
    });
    return unsubscribe;
  }, [checkAccess]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
      </div>
    );
  }

  // Access checking state
  if (user && accessStatus === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
        <p className="text-sm text-slate-500 font-medium">Verifying access...</p>
      </div>
    );
  }

  // Access denied state
  if (user && accessStatus === 'denied') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-red-100 p-3 rounded-xl mb-4">
                <ShieldX className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
            </div>
            <p className="text-sm text-slate-600 text-center leading-relaxed">
              Your account (<span className="font-semibold">{user.email}</span>) is not authorized to access the Flash ID Super Admin portal. Contact an administrator for access.
            </p>
            <p className="text-xs text-slate-400 text-center mt-4">
              You will be signed out automatically...
            </p>
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">
            Flash ID Internal Super Admin Portal
          </p>
        </div>
      </div>
    );
  }

  // QR MFA gate — after SSO + whitelist check, before portal access
  if (user && accessStatus === 'granted' && !isQrVerified) {
    return (
      <QRVerification
        userId={user.uid}
        onVerified={() => {
          const level = localStorage.getItem('superadmin-security-level') || 'secure';
          if (level === 'secure') sessionStorage.setItem('superadmin-qr-verified', '1');
          if (level === 'more-secure') localStorage.setItem('superadmin-qr-verified-at', String(Date.now()));
          setIsQrVerified(true);
        }}
        onCancel={() => signOut()}
      />
    );
  }

  return (
    <FilterProvider>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={localStorage.getItem('superadmin-redirect-after-login') || '/dashboard'} replace /> : <Login />} />
        <Route
          element={
            <ProtectedRoute user={user}>
              <Layout user={user!} />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/agents/field" element={<FieldAgents />} />
          <Route path="/agents/business" element={<BusinessAgents />} />
          <Route path="/agents/verification" element={<VerificationQueue />} />
          <Route path="/agents" element={<Navigate to="/agents/field" replace />} />
          <Route path="/security" element={<Security />} />
          <Route path="/events" element={<Events />} />
          <Route path="/consent-log" element={<ConsentLog />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/settings" element={<Settings user={user!} />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? (localStorage.getItem('superadmin-redirect-after-login') || '/dashboard') : '/login'} replace />} />
      </Routes>
    </FilterProvider>
  );
}
