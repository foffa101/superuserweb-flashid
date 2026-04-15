import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  ShieldAlert,
  ScrollText,
  FileCheck2,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Fingerprint,
  ChevronDown,
} from 'lucide-react';
import { signOut, type User } from '../lib/firebase';
import { useGlobalFilter, type GlobalFilter } from '../lib/FilterContext';

const allNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tenants', label: 'Tenants', icon: Building2 },
  { to: '/security', label: 'Security', icon: ShieldAlert },
  { to: '/events', label: 'Events', icon: ScrollText },
  { to: '/consent-log', label: 'Consent Log', icon: FileCheck2 },
  { to: '/billing', label: 'Billing', icon: DollarSign },
  { to: '/documentation', label: 'Documentation', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface LayoutProps {
  user: User;
}

export default function Layout({ user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { filter, setFilter } = useGlobalFilter();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide Security nav item when filter is 'wp'
  const navItems = filter === 'wp'
    ? allNavItems.filter((item) => item.to !== '/security')
    : allNavItems;
  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = (user.displayName || 'S')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <Fingerprint className="h-8 w-8 text-red-400" />
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Flash ID</h1>
          <p className="text-xs text-slate-400">Super Admin</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <button
              key={item.to}
              onClick={() => { navigate(item.to); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-slate-800 border-r border-slate-700">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-slate-800 z-50">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:flex items-center gap-3">
            <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">INTERNAL</span>
            <div className="flex items-center bg-slate-100 rounded-full p-0.5">
              {(['all', 'wp', 'api'] as GlobalFilter[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full transition-colors ${
                    filter === v
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {v === 'all' ? 'All' : v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-4 p-1 rounded-full hover:bg-slate-100 transition-all"
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900">{user.displayName || 'Super Admin'}</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Session</span>
                </div>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Profile" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm">
                  {userInitials}
                </div>
              )}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden transition-all duration-200 ease-out"
                  style={{ animation: 'dropdownIn 0.15s ease-out' }}
                >
                  <div className="px-4 py-3 border-b border-slate-50 mb-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                  </div>
                  {navItems.filter((item) => ['/dashboard', '/documentation', '/settings'].includes(item.to)).map((item) => (
                    <button
                      key={item.to}
                      onClick={() => { navigate(item.to); setIsUserMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-slate-400" /> {item.label}
                    </button>
                  ))}
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    onClick={() => { handleSignOut(); setIsUserMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-slate-400" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
