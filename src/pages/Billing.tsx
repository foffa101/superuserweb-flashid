import { useState } from 'react';
import {
  DollarSign, Building2, Phone, CreditCard, FileText, Download, Send,
  ArrowLeft, AlertTriangle, CheckCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import {
  mockTenants,
  mockInvoices,
  getBillingSummary,
  getInvoices,
  markInvoicePaid,
  type Tenant,
  type TenantType,
  type Invoice,
  type InvoiceStatus,
} from '../lib/api';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getUsageDisplay(t: Tenant): { label: string; pct: number | null } {
  if (t.type === 'wp') {
    return { label: `${(t.licensedSites || []).length} sites`, pct: null };
  }
  if (t.plan === 'API - Per Call') {
    return { label: `${(t.callsUsed || 0).toLocaleString()} calls`, pct: null };
  }
  if (t.plan === 'API - Enterprise') {
    return { label: `${(t.callsUsed || 0).toLocaleString()} calls`, pct: null };
  }
  if (t.plan === 'API - Unlimited') {
    return { label: `${(t.callsThisMonth || 0).toLocaleString()} calls`, pct: null };
  }
  const used = t.callsUsed || 0;
  const included = t.callsIncluded || 1;
  const pct = Math.round((used / included) * 100);
  return { label: `${used.toLocaleString()} / ${included.toLocaleString()}`, pct };
}

function getOverage(t: Tenant): number {
  if (t.type === 'wp') return 0;
  if (!t.callsIncluded || t.plan === 'API - Per Call' || t.plan === 'API - Enterprise' || t.plan === 'API - Unlimited') return 0;
  return Math.max(0, (t.callsUsed || 0) - t.callsIncluded);
}

function getAmountDue(t: Tenant): number {
  const currentInvoices = mockInvoices.filter((inv) => inv.tenantId === t.id && inv.date.startsWith('2026-04'));
  if (currentInvoices.length > 0) return currentInvoices[0].amount;
  return 0;
}

function getInvoiceStatus(t: Tenant): InvoiceStatus | null {
  const currentInvoices = mockInvoices.filter((inv) => inv.tenantId === t.id && inv.date.startsWith('2026-04'));
  if (currentInvoices.length > 0) return currentInvoices[0].status;
  return null;
}

type View = 'overview' | 'detail';

export default function Billing() {
  const [view, setView] = useState<View>('overview');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | TenantType>('all');
  const [filterOverage, setFilterOverage] = useState(false);
  const [filterUnpaid, setFilterUnpaid] = useState(false);
  const [sortBy, setSortBy] = useState<'amount' | 'usage' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [invoices, setInvoices] = useState<Invoice[]>([...mockInvoices]);

  const summary = getBillingSummary();

  const tenants = [...mockTenants];
  let filtered = tenants.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterOverage && getOverage(t) === 0) return false;
    if (filterUnpaid) {
      const invStatus = getInvoiceStatus(t);
      if (invStatus !== 'unpaid' && invStatus !== 'pending') return false;
    }
    return true;
  });

  if (sortBy) {
    filtered.sort((a, b) => {
      let va = 0, vb = 0;
      if (sortBy === 'amount') { va = getAmountDue(a); vb = getAmountDue(b); }
      if (sortBy === 'usage') { va = a.callsUsed || a.callsThisMonth || (a.licensedSites?.length || 0); vb = b.callsUsed || b.callsThisMonth || (b.licensedSites?.length || 0); }
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }

  const handleSort = (col: 'amount' | 'usage') => {
    if (sortBy === col) {
      setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const openDetail = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setView('detail');
  };

  const handleMarkPaid = (invId: string) => {
    setInvoices((prev) => prev.map((inv) => inv.id === invId ? { ...inv, status: 'paid' as InvoiceStatus } : inv));
    markInvoicePaid(invId);
  };

  // ─── Tenant billing detail ───
  if (view === 'detail' && selectedTenantId) {
    const tenant = tenants.find((t) => t.id === selectedTenantId);
    if (!tenant) return null;
    const tenantInvoices = invoices.filter((inv) => inv.tenantId === selectedTenantId);

    // Simple bar chart data for API tenants
    const barData = tenant.type === 'api'
      ? Array.from({ length: 7 }, (_, i) => ({
          day: `Apr ${i + 3}`,
          calls: Math.floor(Math.random() * ((tenant.callsThisMonth || 1000) / 5)) + 100,
        }))
      : null;
    const maxBar = barData ? Math.max(...barData.map((d) => d.calls)) : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('overview')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{tenant.name} -- Billing</h1>
            <p className="text-sm text-slate-500">{tenant.plan} | {tenant.type === 'wp' ? 'WordPress' : 'API'}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center gap-2">
            <Send className="h-4 w-4" /> Send Invoice
          </button>
          <button className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Add Credit / Adjustment
          </button>
        </div>

        {/* Usage graph for API tenants */}
        {barData && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">API Calls Per Day (Last 7 Days)</h2>
            <div className="flex items-end gap-2 h-40">
              {barData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500">{d.calls.toLocaleString()}</span>
                  <div
                    className="w-full bg-red-500 rounded-t"
                    style={{ height: `${(d.calls / maxBar) * 120}px` }}
                  />
                  <span className="text-[10px] text-slate-400">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoice history */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Invoice History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Usage</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenantInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{inv.plan}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{inv.usage.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">${inv.amount.toFixed(2)}</td>
                    <td className="px-4 py-3"><InvoiceBadge status={inv.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100" title="Download PDF">
                          <Download className="h-4 w-4" />
                        </button>
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            className="p-1.5 rounded text-green-500 hover:text-green-700 hover:bg-slate-100"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {tenantInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No invoices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ─── Overview ───
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-sm text-slate-500 mt-1">Revenue, invoices, and usage overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Tenants" value={summary.totalActiveTenants} icon={Building2} accent="blue" />
        <StatCard label="WP Licenses Active" value={summary.totalWPLicenses} icon={FileText} accent="amber" />
        <StatCard label="API Calls This Month" value={summary.totalAPICallsThisMonth.toLocaleString()} icon={Phone} accent="green" />
        <StatCard label="Est. Revenue This Month" value={`$${summary.estimatedRevenueThisMonth.toLocaleString()}`} icon={DollarSign} accent="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
          {(['all', 'wp', 'api'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilterType(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterType === v ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {v === 'all' ? 'All Types' : v.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFilterOverage((p) => !p)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            filterOverage ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Overage Only
        </button>
        <button
          onClick={() => setFilterUnpaid((p) => !p)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            filterUnpaid ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Unpaid Only
        </button>
      </div>

      {/* Billing table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tenant</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
                <th
                  className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort('usage')}
                >
                  Usage {sortBy === 'usage' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Overage</th>
                <th
                  className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort('amount')}
                >
                  Amount Due {sortBy === 'amount' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Invoice</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const usage = getUsageDisplay(t);
                const overage = getOverage(t);
                const amount = getAmountDue(t);
                const invStatus = getInvoiceStatus(t);
                return (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{t.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.type === 'wp' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {t.type === 'wp' ? 'WP' : 'API'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{t.plan}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-slate-700">{usage.label}</div>
                      {usage.pct !== null && (
                        <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${usage.pct > 100 ? 'bg-red-500' : usage.pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, usage.pct)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {overage > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle className="h-3 w-3" /> +{overage.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                      {amount > 0 ? `$${amount.toFixed(2)}` : '--'}
                    </td>
                    <td className="px-4 py-3">
                      {invStatus ? <InvoiceBadge status={invStatus} /> : <span className="text-xs text-slate-400">--</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetail(t.id)} className="p-1.5 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100" title="View">
                          <FileText className="h-4 w-4" />
                        </button>
                        {invStatus && invStatus !== 'paid' && (
                          <button className="p-1.5 rounded text-amber-500 hover:text-amber-700 hover:bg-slate-100" title="Send Reminder">
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">No tenants match filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Helper components ───

function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  const colors: Record<InvoiceStatus, string> = {
    paid: 'bg-green-100 text-green-700',
    unpaid: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[status]}`}>
      {status}
    </span>
  );
}
