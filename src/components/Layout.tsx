import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  ShieldAlert,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  Fingerprint,
  ChevronDown,
  Shield,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { signOut, type User } from '../lib/firebase';
import { getWhitelist, addToWhitelist, removeFromWhitelist } from '../lib/whitelist';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tenants', label: 'Tenants', icon: Building2 },
  { to: '/security', label: 'Security', icon: ShieldAlert },
  { to: '/events', label: 'Events', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/billing', label: 'Billing', icon: DollarSign },
];

interface LayoutProps {
  user: User;
}

export default function Layout({ user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const navigate = useNavigate();

  const openAccessModal = async () => {
    setIsAccessModalOpen(true);
    setIsUserMenuOpen(false);
    setWhitelistLoading(true);
    try {
      const emails = await getWhitelist();
      setWhitelist(emails);
    } catch {
      setWhitelist([]);
    } finally {
      setWhitelistLoading(false);
    }
  };

  const handleAddEmail = async () => {
    setEmailError(null);
    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setWhitelistLoading(true);
    try {
      const updated = await addToWhitelist(trimmed);
      setWhitelist(updated);
      setNewEmail('');
    } catch {
      setEmailError('Failed to add email.');
    } finally {
      setWhitelistLoading(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    if (email.toLowerCase() === user.email?.toLowerCase()) return;
    setWhitelistLoading(true);
    try {
      const updated = await removeFromWhitelist(email);
      setWhitelist(updated);
    } catch {
      // silently fail
    } finally {
      setWhitelistLoading(false);
    }
  };

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
          <h1 className="text-lg font-bold text-white leading-tight">FlashID</h1>
          <p className="text-xs text-slate-400">Super Admin</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
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
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">INTERNAL</span>
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
                  {navItems.map((item) => (
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
                    onClick={openAccessModal}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-slate-400" /> Manage Access
                  </button>
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

      {/* Access Whitelist Modal */}
      {isAccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsAccessModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-bold text-slate-900">Portal Access Whitelist</h2>
              </div>
              <button
                onClick={() => setIsAccessModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {whitelistLoading && whitelist.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
                </div>
              ) : (
                <ul className="space-y-2">
                  {whitelist.map((email) => {
                    const isSelf = email.toLowerCase() === user.email?.toLowerCase();
                    return (
                      <li
                        key={email}
                        className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5"
                      >
                        <span className="text-sm text-slate-700 truncate">
                          {email}
                          {isSelf && (
                            <span className="ml-2 text-xs text-slate-400 font-medium">(you)</span>
                          )}
                        </span>
                        {!isSelf && (
                          <button
                            onClick={() => handleRemoveEmail(email)}
                            disabled={whitelistLoading}
                            className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50 ml-2 flex-shrink-0"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddEmail(); }}
                  placeholder="Add email address"
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddEmail}
                  disabled={whitelistLoading}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              {emailError && (
                <p className="text-xs text-red-600 mt-2">{emailError}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
