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
  Bot,
  Shield,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
import { signOut, type User } from '../lib/firebase';
import { useGlobalFilter, type GlobalFilter } from '../lib/FilterContext';

const allNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tenants', label: 'Tenants', icon: Building2 },
  { to: '/agents', label: 'Agents', icon: Bot, children: [
    { to: '/agents/field', label: 'Field Agents', icon: Shield },
    { to: '/agents/business', label: 'Business Agents', icon: Building2 },
    { to: '/agents/verification', label: 'Verification Queue', icon: ClipboardCheck },
  ]},
  { to: '/security', label: 'Security', icon: ShieldAlert },
  { to: '/events', label: 'Events', icon: ScrollText },
  { to: '/consent-log', label: 'Consent Log', icon: FileCheck2 },
  { to: '/billing', label: 'Billing', icon: DollarSign },
  { to: '/documentation', label: 'Documentation', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const pageInfo: Record<string, { icon: LucideIcon; title: string; subtitle: string }> = {
  '/dashboard': { icon: LayoutDashboard, title: 'Platform Overview', subtitle: 'Real-time status of the Flash ID platform' },
  '/tenants': { icon: Building2, title: 'Tenant Management', subtitle: 'Manage registered tenants' },
  '/billing': { icon: DollarSign, title: 'Billing', subtitle: 'Revenue, invoices, and usage overview' },
  '/agents/field': { icon: Shield, title: 'Field Agents', subtitle: 'Actions protected by Flash ID approval' },
  '/agents/business': { icon: Building2, title: 'Business Agents', subtitle: 'Manage business tenants and their agent registrations' },
  '/agents/verification': { icon: ClipboardCheck, title: 'Verification Queue', subtitle: 'Review and verify pending business applications' },
  '/security': { icon: ShieldAlert, title: 'Platform Security', subtitle: 'Manage rate limiting, bans, and geo settings' },
  '/events': { icon: ScrollText, title: 'Platform Event Log', subtitle: 'Activity and audit events' },
  '/consent-log': { icon: FileCheck2, title: 'Consent Log', subtitle: 'Immutable audit trail of site authorizations' },
  '/documentation': { icon: BookOpen, title: 'Documentation', subtitle: 'How to use the Flash ID Super Admin portal' },
  '/settings': { icon: Settings, title: 'Settings', subtitle: 'Profile and portal preferences' },
};

interface LayoutProps {
  user: User;
}

export default function Layout({ user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string | null>(null);
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
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Fingerprint className="h-8 w-8 text-red-400" />
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Flash ID</h1>
            <p className="text-xs text-slate-400">Super Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] font-medium text-red-400 bg-red-900/30 border border-red-700/40 px-1.5 py-0.5 rounded">INTERNAL</span>
          <div className="flex items-center bg-slate-700 rounded-full p-0.5">
            {(['all', 'wp', 'api'] as GlobalFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                  filter === v
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {v === 'all' ? 'All' : v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const children = (item as any).children as typeof allNavItems | undefined;
          const isActive = location.pathname === item.to;
          const isParentActive = children?.some((c) => location.pathname === c.to);
          const isExpanded = expandedNav === item.to || isParentActive;

          if (children) {
            return (
              <div key={item.to}>
                <button
                  onClick={() => setExpandedNav(isExpanded ? null : item.to)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${
                    isParentActive
                      ? 'bg-red-600/20 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {children.map((child) => {
                      const isChildActive = location.pathname === child.to;
                      return (
                        <button
                          key={child.to}
                          onClick={() => { navigate(child.to); setSidebarOpen(false); }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
                            isChildActive
                              ? 'bg-red-600 text-white'
                              : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <child.icon className="h-4 w-4" />
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700"
            >
              <Menu className="h-5 w-5" />
            </button>
            {(() => {
              const info = pageInfo[location.pathname];
              if (!info) return null;
              const PageIcon = info.icon;
              return (
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <PageIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">{info.title}</h1>
                    <p className="text-xs text-slate-500">{info.subtitle}</p>
                  </div>
                </div>
              );
            })()}
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
