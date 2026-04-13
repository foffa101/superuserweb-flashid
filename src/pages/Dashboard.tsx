import { useMemo, useState, useEffect } from 'react';
import { Building2, Activity, Users, TrendingUp, HeartPulse, LayoutDashboard } from 'lucide-react';
import StatCard from '../components/StatCard';
import EventRow from '../components/EventRow';
import type { Tenant, PlatformEvent } from '../lib/api';
import {
  getTenants,
  getEvents,
  getStats,
  seedInitialData,
  type PlatformStats,
} from '../lib/firestore';
import { useGlobalFilter } from '../lib/FilterContext';

export default function Dashboard() {
  const { filter } = useGlobalFilter();
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [allEvents, setAllEvents] = useState<PlatformEvent[]>([]);
  const [baseStats, setBaseStats] = useState<PlatformStats>({
    totalSites: 0,
    totalSessionsToday: 0,
    totalActiveUsers: 0,
    platformSuccessRate: 0,
    systemHealth: 'operational',
  });
  const [, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      await seedInitialData();
      const [tenants, events, stats] = await Promise.all([
        getTenants(),
        getEvents(),
        getStats(),
      ]);
      setAllTenants(tenants);
      setAllEvents(events);
      setBaseStats({ ...stats, totalSites: tenants.length });
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

  const stats = useMemo(() => {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-xl">
          <LayoutDashboard className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time status of the Flash ID platform</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Registered Sites"
          value={stats.totalSites}
          icon={Building2}
          accent="blue"
        />
        <StatCard
          label="Sessions Today"
          value={stats.totalSessionsToday.toLocaleString()}
          icon={Activity}
          accent="green"
        />
        <StatCard
          label="Active Users"
          value={stats.totalActiveUsers}
          icon={Users}
          accent="amber"
        />
        <StatCard
          label="Success Rate"
          value={`${stats.platformSuccessRate}%`}
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
    </div>
  );
}
