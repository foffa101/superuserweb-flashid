import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthChange, signOut, type User } from './lib/firebase';
import { isEmailWhitelisted } from './lib/whitelist';
import { ShieldX } from 'lucide-react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Security from './pages/Security';
import Events from './pages/Events';
import Settings from './pages/Settings';
import Billing from './pages/Billing';

type AccessStatus = 'checking' | 'granted' | 'denied';

function ProtectedRoute({ user, children }: { user: User | null; children: React.ReactNode }) {
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('checking');

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
              Your account (<span className="font-semibold">{user.email}</span>) is not authorized to access the FlashID Super Admin portal. Contact an administrator for access.
            </p>
            <p className="text-xs text-slate-400 text-center mt-4">
              You will be signed out automatically...
            </p>
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">
            FlashID Internal Super Admin Portal
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
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
        <Route path="/security" element={<Security />} />
        <Route path="/events" element={<Events />} />
        <Route path="/settings" element={<Settings user={user!} />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
