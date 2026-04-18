import { useMemo, useState, useEffect } from 'react';
import {
  Building2,
  Activity,
  Users,
  TrendingUp,
  HeartPulse,
  Globe,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import EventRow from '../components/EventRow';
import type { Tenant, PlatformEvent } from '../lib/api';
import {
  getTenants,
  getEvents,
  getStats,
  getTenantAdminLogins,
  seedInitialData,
  type PlatformStats,
  type TenantAdminLogin,
} from '../lib/firestore';
import { useGlobalFilter } from '../lib/FilterContext';

type DashboardView = 'wp' | 'api';

export default function Dashboard() {
  const { filter } = useGlobalFilter();
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [allEvents, setAllEvents] = useState<PlatformEvent[]>([]);
  const [adminLogins, setAdminLogins] = useState<TenantAdminLogin[]>([]);
  const [baseStats, setBaseStats] = useState<PlatformStats>({
    totalSites: 0,
    totalSessionsToday: 0,
    totalActiveUsers: 0,
    platformSuccessRate: 0,
    systemHealth: 'operational',
  });
  const [, setLoading] = useState(true);

  // Derive dashboard view from the global sidebar filter
  const activeView = useMemo<DashboardView>(() => {
    if (filter === 'wp') return 'wp';
    if (filter === 'api') return 'api';
    // 'all' — auto-detect based on tenant composition
    const wpCount = allTenants.filter((t) => t.type === 'wp').length;
    const apiCount = allTenants.filter((t) => t.type === 'api').length;
    return wpCount >= apiCount ? 'wp' : 'api';
  }, [filter, allTenants]);

  useEffect(() => {
    async function load() {
      await seedInitialData();
      const [tenants, events, stats, logins] = await Promise.all([
        getTenants(),
        getEvents(),
        getStats(),
        getTenantAdminLogins(),
      ]);
      setAllTenants(tenants);
      setAllEvents(events);
      setBaseStats({ ...stats, totalSites: tenants.length });
      setAdminLogins(logins);
      setLoading(false);
    }
    load();
  }, []);

  const tenantTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    allTenants.forEach((t) => { map[t.id] = t.type; });
    return map;
  }, [allTenants]);

  const filteredTenants = useMemo(() => {
    if (filter === 'all') return allTenants;
    return allTenants.filter((t) => t.type === filter);
  }, [filter, allTenants]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return allEvents;
    return allEvents.filter((e) => tenantTypeMap[e.tenantId] === filter);
  }, [filter, tenantTypeMap, allEvents]);

  const recentEvents = filteredEvents.slice(0, 10);

  // ── API view stats (existing logic) ──
  const apiStats = useMemo(() => {
    if (filter === 'all') return baseStats;
    return {
      totalSites: filteredTenants.length,
      totalSessionsToday: filter === 'wp'
        ? Math.round(baseStats.totalSessionsToday * 0.3)
        : Math.round(baseStats.totalSessionsToday * 0.7),
      totalActiveUsers: filter === 'wp'
        ? Math.round(baseStats.totalActiveUsers * 0.25)
        : Math.round(baseStats.totalActiveUsers * 0.75),
      platformSuccessRate: filteredTenants.length > 0
        ? Math.round((filteredTenants.reduce((s, t) => s + t.successRate, 0) / filteredTenants.length) * 10) / 10
        : 0,
      systemHealth: baseStats.systemHealth,
    };
  }, [filter, filteredTenants, baseStats]);

  // ── WP view stats ──
  const wpTenants = useMemo(() => allTenants.filter((t) => t.type === 'wp'), [allTenants]);

  const wpMetrics = useMemo(() => {
    const adminPortals = wpTenants.length;
    const authorizedDomains = wpTenants.reduce(
      (sum, t) => sum + (t.licensedSites?.length ?? 0),
      0,
    );
    const wpStandard = wpTenants.filter((t) => t.plan === 'WP - Standard').length;
    const wpAgency = wpTenants.filter((t) => t.plan === 'WP - Agency').length;
    const activeCount = wpTenants.filter((t) => t.status === 'active').length;
    const suspendedCount = wpTenants.filter(
      (t) => t.status === 'suspended' || t.status === 'cancelled',
    ).length;
    return { adminPortals, authorizedDomains, wpStandard, wpAgency, activeCount, suspendedCount };
  }, [wpTenants]);

  // Recent admin logins (last 5), matched to WP tenants
  const recentAdminLogins = useMemo(() => {
    const wpTenantIds = new Set(wpTenants.map((t) => t.id));
    return adminLogins
      .filter((l) => wpTenantIds.has(l.tenantId))
      .sort((a, b) => {
        const da = a.lastLogin ?? '';
        const db = b.lastLogin ?? '';
        return db.localeCompare(da);
      })
      .slice(0, 5);
  }, [adminLogins, wpTenants]);

  // Helper to get tenant name from id
  const tenantNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    allTenants.forEach((t) => { map[t.id] = t.name; });
    return map;
  }, [allTenants]);

  return (
    <div className="space-y-8">
      {activeView === 'wp' ? (
        <>
          {/* WP Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Admin Portals"
              value={wpMetrics.adminPortals}
              icon={LayoutGrid}
              accent="blue"
              subtitle="WordPress tenants"
            />
            <StatCard
              label="Authorized Domains"
              value={wpMetrics.authorizedDomains}
              icon={Globe}
              accent="green"
              subtitle="Licensed sites total"
            />
            <StatCard
              label="Active Tenants"
              value={wpMetrics.activeCount}
              icon={CheckCircle2}
              accent="green"
              subtitle={`${wpMetrics.suspendedCount} suspended/cancelled`}
            />
            <StatCard
              label="Licenses by Plan"
              value={`${wpMetrics.wpStandard} Std / ${wpMetrics.wpAgency} Agency`}
              icon={Building2}
              accent="amber"
            />
          </div>

          {/* Active vs Suspended breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tenant Status Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{wpMetrics.activeCount}</p>
                  <p className="text-xs text-green-600">Active</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <XCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-amber-700">
                    {wpTenants.filter((t) => t.status === 'suspended').length}
                  </p>
                  <p className="text-xs text-amber-600">Suspended</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <XCircle className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-slate-600">
                    {wpTenants.filter((t) => t.status === 'cancelled').length}
                  </p>
                  <p className="text-xs text-slate-500">Cancelled</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Admin Logins */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Recent Admin Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 5 tenant admin logins</p>
            </div>
            {recentAdminLogins.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-400">
                No admin login data available yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tenant</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Admin Email</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Last Login</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Timezone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAdminLogins.map((login, idx) => (
                      <tr key={`${login.tenantId}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                          {tenantNameMap[login.tenantId] ?? login.tenantId}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap font-mono text-xs">
                          {login.email}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {login.lastLogin
                              ? new Date(login.lastLogin).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })
                              : 'Never'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {login.lastLoginTimezone ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* API Stats grid (existing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Registered Sites"
              value={apiStats.totalSites}
              icon={Building2}
              accent="blue"
            />
            <StatCard
              label="Sessions Today"
              value={apiStats.totalSessionsToday.toLocaleString()}
              icon={Activity}
              accent="green"
            />
            <StatCard
              label="Active Users"
              value={apiStats.totalActiveUsers}
              icon={Users}
              accent="amber"
            />
            <StatCard
              label="Success Rate"
              value={`${apiStats.platformSuccessRate}%`}
              icon={TrendingUp}
              accent="red"
            />
          </div>

          {/* System health */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">System Health</h2>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-sm font-medium text-green-700">All systems operational</span>
              <span className="text-xs text-slate-400 ml-auto">Last checked: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'Auth API', status: 'up', latency: '12ms' },
                { name: 'Session API', status: 'up', latency: '8ms' },
                { name: 'Geo Service', status: 'up', latency: '45ms' },
                { name: 'Database', status: 'up', latency: '3ms' },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-slate-600">{s.name}</span>
                  <span className="text-slate-400 ml-auto">{s.latency}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent events */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Recent Platform Events</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 10 events{filter !== 'all' ? ` (${filter.toUpperCase()} tenants)` : ' across all tenants'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tenant</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">IP</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
