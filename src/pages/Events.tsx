import { useState, useMemo, useEffect } from 'react';
import { Download, Trash2, Loader2 } from 'lucide-react';
import EventRow from '../components/EventRow';
import { type EventType, type EventStatus, type PlatformEvent, type Tenant } from '../lib/api';
import { getEvents, getTenants, deleteAllEvents, seedInitialData, getWpEvents, type WpEvent, type WpEventType } from '../lib/firestore';
import { useGlobalFilter } from '../lib/FilterContext';

const PAGE_SIZE = 10;

const eventTypes: EventType[] = [
  'session_created', 'session_verified', 'session_expired', 'session_failed',
  'rate_limit_hit', 'ip_banned', 'ip_unbanned', 'api_key_rotated',
  'tenant_suspended', 'tenant_activated', 'settings_updated', 'login',
];

const statuses: EventStatus[] = ['success', 'warning', 'error', 'info'];

// ─── WP Event badge colors ───
const wpEventBadgeColors: Record<WpEventType, string> = {
  license_activated: 'bg-green-100 text-green-700',
  license_deactivated: 'bg-red-100 text-red-700',
  license_renewed: 'bg-blue-100 text-blue-700',
  domain_added: 'bg-indigo-100 text-indigo-700',
  domain_removed: 'bg-amber-100 text-amber-700',
  tenant_created: 'bg-teal-100 text-teal-700',
  admin_login: 'bg-slate-100 text-slate-700',
  enrollment_approved: 'bg-green-100 text-green-700',
  enrollment_rejected: 'bg-red-100 text-red-700',
};

// ─── Mock WP Events (fallback when collection is empty) ───
const mockWpEvents: WpEvent[] = [
  {
    id: 'wp_mock_1',
    timestamp: '2026-04-17T14:32:00Z',
    eventType: 'license_activated',
    tenantName: 'Acme Corp',
    domain: 'acme-corp.com',
    adminEmail: 'admin@acme-corp.com',
    status: 'success',
    details: 'WP plugin license activated for site acme-corp.com',
  },
  {
    id: 'wp_mock_2',
    timestamp: '2026-04-17T13:15:00Z',
    eventType: 'domain_added',
    tenantName: 'Globex Inc',
    domain: 'globex.io',
    adminEmail: 'it@globex.io',
    status: 'success',
    details: 'New domain globex.io added to tenant',
  },
  {
    id: 'wp_mock_3',
    timestamp: '2026-04-17T11:45:00Z',
    eventType: 'enrollment_rejected',
    tenantName: 'Initech',
    domain: 'initech.net',
    adminEmail: 'hr@initech.net',
    status: 'failed',
    details: 'Enrollment rejected: missing business verification documents',
  },
  {
    id: 'wp_mock_4',
    timestamp: '2026-04-16T22:10:00Z',
    eventType: 'admin_login',
    tenantName: 'Acme Corp',
    domain: 'acme-corp.com',
    adminEmail: 'admin@acme-corp.com',
    status: 'success',
    details: 'Admin login from IP 203.0.113.42',
  },
  {
    id: 'wp_mock_5',
    timestamp: '2026-04-16T18:30:00Z',
    eventType: 'tenant_created',
    tenantName: 'Wayne Enterprises',
    domain: 'wayne.co',
    adminEmail: 'bruce@wayne.co',
    status: 'success',
    details: 'New WP tenant provisioned with starter plan',
  },
  {
    id: 'wp_mock_6',
    timestamp: '2026-04-16T15:05:00Z',
    eventType: 'license_renewed',
    tenantName: 'Globex Inc',
    domain: 'globex.io',
    adminEmail: 'billing@globex.io',
    status: 'success',
    details: 'Annual license renewed until 2027-04-16',
  },
  {
    id: 'wp_mock_7',
    timestamp: '2026-04-16T09:22:00Z',
    eventType: 'license_deactivated',
    tenantName: 'Initech',
    domain: 'initech.net',
    adminEmail: 'admin@initech.net',
    status: 'success',
    details: 'License deactivated due to non-payment',
  },
  {
    id: 'wp_mock_8',
    timestamp: '2026-04-15T20:00:00Z',
    eventType: 'domain_removed',
    tenantName: 'Acme Corp',
    domain: 'old-acme.com',
    adminEmail: 'admin@acme-corp.com',
    status: 'success',
    details: 'Deprecated domain old-acme.com removed from tenant',
  },
  {
    id: 'wp_mock_9',
    timestamp: '2026-04-15T16:48:00Z',
    eventType: 'enrollment_approved',
    tenantName: 'Stark Industries',
    domain: 'stark.tech',
    adminEmail: 'tony@stark.tech',
    status: 'success',
    details: 'Business enrollment approved after KYB verification',
  },
];

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// ─── WP Events Table ───
function WpEventsSection({ events }: { events: WpEvent[] }) {
  const [wpPage, setWpPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const paged = events.slice((wpPage - 1) * PAGE_SIZE, wpPage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">WP Events</h2>
        <p className="text-sm text-slate-500">{events.length} events</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Date/Time</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Event Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tenant Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Domain/Site</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Admin Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                    {formatTimestamp(e.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${wpEventBadgeColors[e.eventType]}`}>
                      {e.eventType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                    {e.tenantName}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                    {e.domain}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {e.adminEmail}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      e.status === 'success' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${e.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                    {e.details}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                    No WP events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500">
              Showing {(wpPage - 1) * PAGE_SIZE + 1}-{Math.min(wpPage * PAGE_SIZE, events.length)} of {events.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWpPage(Math.max(1, wpPage - 1))}
                disabled={wpPage === 1}
                className="px-3 py-1 rounded text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setWpPage(p)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    p === wpPage ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setWpPage(Math.min(totalPages, wpPage + 1))}
                disabled={wpPage === totalPages}
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

export default function Events() {
  const { filter: globalFilter } = useGlobalFilter();
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [wpEvents, setWpEvents] = useState<WpEvent[]>([]);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      await seedInitialData();
      const [evts, tenants, wpEvts] = await Promise.all([getEvents(), getTenants(), getWpEvents()]);
      setEvents(evts);
      setAllTenants(tenants);
      // Use mock data if Firestore wp_events collection is empty
      setWpEvents(wpEvts.length > 0 ? wpEvts : mockWpEvents);
      setLoading(false);
    }
    load();
  }, []);

  // Build tenant type lookup
  const tenantTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    allTenants.forEach((t) => { map[t.id] = t.type; });
    return map;
  }, [allTenants]);

  // Tenants visible under current global filter (for tenant dropdown)
  const visibleTenants = useMemo(() => {
    if (globalFilter === 'all') return allTenants;
    return allTenants.filter((t) => t.type === globalFilter);
  }, [globalFilter, allTenants]);

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

  const handleClearLog = async () => {
    if (window.confirm('Are you sure you want to clear the entire event log? This action cannot be undone.')) {
      setEvents([]);
      setPage(1);
      try {
        await deleteAllEvents();
      } catch (e) {
        console.error('Failed to clear event log:', e);
      }
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

  // Determine page title
  const pageTitle = globalFilter === 'wp' ? 'WP Events' : globalFilter === 'api' ? 'API Events' : 'Events';

  // Which sections to show
  const showWp = globalFilter === 'all' || globalFilter === 'wp';
  const showApi = globalFilter === 'all' || globalFilter === 'api';

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading Events...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>

      {/* ─── WP Events Section ─── */}
      {showWp && <WpEventsSection events={wpEvents} />}

      {/* ─── API Events Section ─── */}
      {showApi && (
        <div className="space-y-4">
          {globalFilter === 'all' && (
            <h2 className="text-lg font-semibold text-slate-800">API Events</h2>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{filtered.length} events {filtered.length !== events.length && `(of ${events.length} total)`}</p>
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
      )}
    </div>
  );
}
