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

type SubGrowthFilter = 'T' | 'LW' | 'LM' | 'L3M' | 'YTD';

function SubscriptionGrowthChart({ wpTenants }: { wpTenants: Tenant[] }) {
  const [timeFilter, setTimeFilter] = useState<SubGrowthFilter>('LM');

  const chartData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Determine date range and grouping
    let startDate: Date;
    let groupByWeek = false;

    switch (timeFilter) {
      case 'T':
        startDate = today;
        break;
      case 'LW':
        startDate = new Date(today.getTime() - 6 * 86400000);
        break;
      case 'LM':
        startDate = new Date(today.getTime() - 29 * 86400000);
        break;
      case 'L3M':
        startDate = new Date(today.getTime() - 89 * 86400000);
        groupByWeek = true;
        break;
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupByWeek = true;
        break;
    }

    // Sort tenants by createdAt
    const sorted = [...wpTenants]
      .filter((t) => t.createdAt)
      .sort((a, b) => (a.createdAt! > b.createdAt! ? 1 : -1));

    // Count cumulative subscriptions up to start date
    let cumulativeBefore = 0;
    for (const t of sorted) {
      const d = new Date(t.createdAt!);
      if (d < startDate) cumulativeBefore++;
    }

    // Build daily counts from startDate to today
    const dailyMap = new Map<string, number>();
    const endDate = new Date(today.getTime() + 86400000); // include today

    for (let d = new Date(startDate); d < endDate; d = new Date(d.getTime() + 86400000)) {
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, 0);
    }

    for (const t of sorted) {
      const key = t.createdAt!.slice(0, 10);
      if (dailyMap.has(key)) {
        dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
      }
    }

    // Build cumulative series
    const dailyEntries = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let cumulative = cumulativeBefore;
    const dailySeries = dailyEntries.map(([date, count]) => {
      cumulative += count;
      return { date, value: cumulative };
    });

    if (!groupByWeek) return dailySeries;

    // Group by week: take the last day of each 7-day bucket
    const weekly: { date: string; value: number }[] = [];
    for (let i = 0; i < dailySeries.length; i += 7) {
      const end = Math.min(i + 6, dailySeries.length - 1);
      weekly.push(dailySeries[end]);
    }
    // Ensure the last data point is always included
    if (weekly.length > 0 && weekly[weekly.length - 1].date !== dailySeries[dailySeries.length - 1].date) {
      weekly.push(dailySeries[dailySeries.length - 1]);
    }
    return weekly;
  }, [wpTenants, timeFilter]);

  const filters: { key: SubGrowthFilter; label: string }[] = [
    { key: 'T', label: 'T' },
    { key: 'LW', label: 'LW' },
    { key: 'LM', label: 'LM' },
    { key: 'L3M', label: 'L3M' },
    { key: 'YTD', label: 'YTD' },
  ];

  // Chart dimensions
  const paddingLeft = 48;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 40;
  const viewBoxW = 800;
  const viewBoxH = 300;
  const chartW = viewBoxW - paddingLeft - paddingRight;
  const chartH = viewBoxH - paddingTop - paddingBottom;

  const yMin = chartData.length > 0 ? Math.min(...chartData.map((d) => d.value)) : 0;
  const yMax = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) : 1;
  const yRange = yMax - yMin || 1;
  // Add 10% padding to Y range
  const yFloor = Math.max(0, yMin - Math.ceil(yRange * 0.1));
  const yCeil = yMax + Math.ceil(yRange * 0.1);
  const ySpan = yCeil - yFloor || 1;

  const points = chartData.map((d, i) => {
    const x = paddingLeft + (chartData.length > 1 ? (i / (chartData.length - 1)) * chartW : chartW / 2);
    const y = paddingTop + chartH - ((d.value - yFloor) / ySpan) * chartH;
    return { x, y, date: d.date, value: d.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L${points[points.length - 1].x},${paddingTop + chartH} L${points[0].x},${paddingTop + chartH} Z`
    : '';

  // Y axis ticks (5 ticks)
  const yTicks: number[] = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    yTicks.push(Math.round(yFloor + (ySpan * i) / tickCount));
  }

  // X axis labels — pick up to 6 evenly spaced
  const xLabelCount = Math.min(6, points.length);
  const xLabelIndices: number[] = [];
  if (points.length <= xLabelCount) {
    points.forEach((_, i) => xLabelIndices.push(i));
  } else {
    for (let i = 0; i < xLabelCount; i++) {
      xLabelIndices.push(Math.round((i / (xLabelCount - 1)) * (points.length - 1)));
    }
  }

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Subscription Growth</h2>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                timeFilter === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
          No subscription data for this period.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="subGrowthFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Y axis grid lines and labels */}
          {yTicks.map((tick) => {
            const y = paddingTop + chartH - ((tick - yFloor) / ySpan) * chartH;
            return (
              <g key={tick}>
                <line x1={paddingLeft} y1={y} x2={viewBoxW - paddingRight} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="11">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {points.length > 1 && (
            <path d={areaPath} fill="url(#subGrowthFill)" />
          )}

          {/* Line */}
          {points.length > 1 && (
            <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          )}

          {/* Data points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#4f46e5" stroke="#fff" strokeWidth="2" />
          ))}

          {/* X axis labels */}
          {xLabelIndices.map((idx) => {
            const p = points[idx];
            return (
              <text key={idx} x={p.x} y={viewBoxH - 8} textAnchor="middle" fill="#94a3b8" fontSize="11">
                {formatDateLabel(p.date)}
              </text>
            );
          })}
        </svg>
      )}
    </div>
  );
}

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
    const domainsPerPortal = adminPortals > 0 ? (authorizedDomains / adminPortals).toFixed(1) : '0';
    const wpStandard = wpTenants.filter((t) => t.plan === 'WP - Standard').length;
    const wpAgency = wpTenants.filter((t) => t.plan === 'WP - Agency').length;
    const activeCount = wpTenants.filter((t) => t.status === 'active').length;
    const suspendedCount = wpTenants.filter(
      (t) => t.status === 'suspended' || t.status === 'cancelled',
    ).length;

    // Revenue estimates (Standard=$9/mo, Agency=$29/mo)
    const activeStandard = wpTenants.filter((t) => t.status === 'active' && t.plan === 'WP - Standard').length;
    const activeAgency = wpTenants.filter((t) => t.status === 'active' && t.plan === 'WP - Agency').length;
    const mrr = activeStandard * 9 + activeAgency * 29;

    // Licenses expiring within 30 days
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 86400000);
    const expiringSoon = wpTenants.filter((t) => {
      if (!t.licenseExpiry || t.status !== 'active') return false;
      const exp = new Date(t.licenseExpiry);
      return exp <= thirtyDays && exp >= now;
    }).length;

    return { adminPortals, authorizedDomains, domainsPerPortal, wpStandard, wpAgency, activeCount, suspendedCount, mrr, expiringSoon, activeStandard, activeAgency };
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
              subtitle={`${wpMetrics.domainsPerPortal} avg per portal`}
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

          {/* Revenue & Renewals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Monthly Revenue (MRR)</p>
              <p className="text-2xl font-bold text-slate-900">${wpMetrics.mrr.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span></p>
              <p className="text-xs text-slate-400 mt-1">{wpMetrics.activeStandard} Standard × $9 + {wpMetrics.activeAgency} Agency × $29</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Renewals Due (30 days)</p>
              <p className={`text-2xl font-bold ${wpMetrics.expiringSoon > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{wpMetrics.expiringSoon}</p>
              <p className="text-xs text-slate-400 mt-1">{wpMetrics.expiringSoon > 0 ? 'Licenses expiring soon' : 'No upcoming renewals'}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Annual Revenue (ARR)</p>
              <p className="text-2xl font-bold text-slate-900">${(wpMetrics.mrr * 12).toLocaleString()}<span className="text-sm font-normal text-slate-400">/yr</span></p>
              <p className="text-xs text-slate-400 mt-1">Based on current active subscriptions</p>
            </div>
          </div>

          {/* Subscription Growth Chart */}
          <SubscriptionGrowthChart wpTenants={wpTenants} />

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
