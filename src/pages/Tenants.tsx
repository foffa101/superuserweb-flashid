import { useState } from 'react';
import { Building2, ChevronDown, ChevronUp, RotateCcw, Ban, CheckCircle, Trash2, Eye, EyeOff } from 'lucide-react';
import { mockTenants, type Tenant } from '../lib/api';

function maskKey(key: string): string {
  return key.slice(0, 12) + '...' + key.slice(-4);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

const planColors: Record<string, string> = {
  free: 'bg-slate-100 text-slate-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleRevealKey = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === 'active' ? 'suspended' : 'active' } : t,
      ),
    );
  };

  const resetApiKey = (id: string) => {
    const newSuffix = Math.random().toString(36).slice(2, 22);
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, apiKey: `fid_live_${newSuffix}` } : t,
      ),
    );
  };

  const deleteTenant = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this tenant? This action cannot be undone.')) {
      setTenants((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Management</h1>
          <p className="text-sm text-slate-500 mt-1">{tenants.length} registered sites</p>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Site Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">URL</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Owner</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">API Key</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <TenantRow
                  key={t.id}
                  tenant={t}
                  expanded={expandedId === t.id}
                  keyRevealed={revealedKeys.has(t.id)}
                  onToggleExpand={() => toggleExpand(t.id)}
                  onToggleRevealKey={() => toggleRevealKey(t.id)}
                  onToggleStatus={() => toggleStatus(t.id)}
                  onResetKey={() => resetApiKey(t.id)}
                  onDelete={() => deleteTenant(t.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface TenantRowProps {
  tenant: Tenant;
  expanded: boolean;
  keyRevealed: boolean;
  onToggleExpand: () => void;
  onToggleRevealKey: () => void;
  onToggleStatus: () => void;
  onResetKey: () => void;
  onDelete: () => void;
}

function TenantRow({ tenant, expanded, keyRevealed, onToggleExpand, onToggleRevealKey, onToggleStatus, onResetKey, onDelete }: TenantRowProps) {
  return (
    <>
      <tr
        className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={onToggleExpand}
      >
        <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            {tenant.siteName}
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-blue-600 whitespace-nowrap">
          <a href={tenant.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
            {tenant.url.replace('https://', '')}
          </a>
        </td>
        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{tenant.ownerEmail}</td>
        <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span>{keyRevealed ? tenant.apiKey : maskKey(tenant.apiKey)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleRevealKey(); }}
              className="text-slate-400 hover:text-slate-600"
              title={keyRevealed ? 'Hide key' : 'Reveal key'}
            >
              {keyRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${planColors[tenant.plan]}`}>
            {tenant.plan}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize ${
            tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${tenant.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
            {tenant.status}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(tenant.createdAt)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onToggleStatus}
              className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                tenant.status === 'active' ? 'text-amber-500 hover:text-amber-600' : 'text-green-500 hover:text-green-600'
              }`}
              title={tenant.status === 'active' ? 'Suspend' : 'Activate'}
            >
              {tenant.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            </button>
            <button
              onClick={onResetKey}
              className="p-1.5 rounded text-blue-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
              title="Reset API Key"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded text-red-500 hover:text-red-600 hover:bg-slate-100 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50 border-b border-slate-200">
          <td colSpan={8} className="px-8 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Sessions</p>
                <p className="text-lg font-semibold text-slate-900">{tenant.sessionCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Success Rate</p>
                <p className="text-lg font-semibold text-slate-900">{tenant.successRate}%</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Last Activity</p>
                <p className="text-lg font-semibold text-slate-900">{formatDateTime(tenant.lastActivity)}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
