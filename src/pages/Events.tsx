import { useState, useMemo } from 'react';
import { Download, Trash2, ScrollText } from 'lucide-react';
import EventRow from '../components/EventRow';
import { mockEvents, mockTenants, type EventType, type EventStatus, type PlatformEvent } from '../lib/api';
import { useGlobalFilter } from '../lib/FilterContext';

const PAGE_SIZE = 10;

const eventTypes: EventType[] = [
  'session_created', 'session_verified', 'session_expired', 'session_failed',
  'rate_limit_hit', 'ip_banned', 'ip_unbanned', 'api_key_rotated',
  'tenant_suspended', 'tenant_activated', 'settings_updated', 'login',
];

const statuses: EventStatus[] = ['success', 'warning', 'error', 'info'];

export default function Events() {
  const { filter: globalFilter } = useGlobalFilter();
  const [events, setEvents] = useState<PlatformEvent[]>(mockEvents);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Build tenant type lookup
  const tenantTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    mockTenants.forEach((t) => { map[t.id] = t.type; });
    return map;
  }, []);

  // Tenants visible under current global filter (for tenant dropdown)
  const visibleTenants = useMemo(() => {
    if (globalFilter === 'all') return mockTenants;
    return mockTenants.filter((t) => t.type === globalFilter);
  }, [globalFilter]);

  const filtered = useMemo(() => {
    let result = events;

    // Apply global filter first: filter events by tenant type
    if (globalFilter !== 'all') {
      result = result.filter((e) => tenantTypeMap[e.tenantId] === globalFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((e) => e.eventType === typeFilter);
    }
    if (tenantFilter !== 'all') {
      result = result.filter((e) => e.tenantId === tenantFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter((e) => new Date(e.timestamp).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000; // end of day
      result = result.filter((e) => new Date(e.timestamp).getTime() <= to);
    }

    return result;
  }, [events, globalFilter, tenantTypeMap, typeFilter, tenantFilter, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleClearLog = () => {
    if (window.confirm('Are you sure you want to clear the entire event log? This action cannot be undone.')) {
      setEvents([]);
      setPage(1);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Tenant', 'Event Type', 'IP', 'Location', 'Status', 'Details'];
    const rows = filtered.map((e) => [
      e.timestamp, e.tenantName, e.eventType, e.ip, e.location, e.status, e.details,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashid-events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset page when filters change
  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <ScrollText className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Event Log</h1>
            <p className="text-sm text-slate-500 mt-1">{filtered.length} events {filtered.length !== events.length && `(of ${events.length} total)`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleClearLog}
            className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear Log
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Event Type</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); resetPage(); }}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            >
              <option value="all">All types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tenant</label>
            <select
              value={tenantFilter}
              onChange={(e) => { setTenantFilter(e.target.value); resetPage(); }}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            >
              <option value="all">All tenants</option>
              {visibleTenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            >
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
              {paged.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                    No events match the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    p === page ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
