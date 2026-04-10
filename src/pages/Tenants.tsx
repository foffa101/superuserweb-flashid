import React, { useState } from 'react';
import {
  Building2, Plus, Eye, Edit3, Ban, CheckCircle, ArrowLeft, X, Trash2,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  mockTenants,
  generateLicenseKey,
  generateApiKeyHalf,
  type Tenant,
  type TenantType,
  type TenantStatus,
  type Plan,
  type WPPlan,
  type APIPlan,
  type LicenseStatus,
  type BillingCycle,
} from '../lib/api';
import { useGlobalFilter } from '../lib/FilterContext';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const wpPlans: WPPlan[] = ['WP - Standard', 'WP - Agency'];
const apiPlans: APIPlan[] = ['API - Per Call', 'API - Starter', 'API - Growth', 'API - Business', 'API - Unlimited', 'API - Enterprise'];

const planCallsIncluded: Record<string, number | undefined> = {
  'API - Starter': 1000,
  'API - Growth': 10000,
  'API - Business': 50000,
};

function displayPlan(plan: string): string {
  return plan.replace(/^(WP|API)\s*-\s*/, '');
}

function emptyTenant(type: TenantType): Partial<Tenant> {
  return {
    name: '',
    email: '',
    type,
    plan: type === 'wp' ? 'WP - Standard' : 'API - Per Call',
    status: 'active',
    notes: '',
    sessionCount: 0,
    successRate: 0,
    lastActivity: new Date().toISOString(),
    ...(type === 'wp'
      ? { licenseKey: generateLicenseKey(), licenseStatus: 'active' as LicenseStatus, licensedSites: [], licenseExpiry: '' }
      : { orgName: '', billingCycle: 'monthly' as BillingCycle, apiKeyHalf: generateApiKeyHalf(), pricePerCall: 0.02, callsUsed: 0, callsThisMonth: 0 }),
  };
}

type View = 'list' | 'detail' | 'form';

export default function Tenants() {
  const { filter: globalFilter } = useGlobalFilter();
  const [tenants, setTenants] = useState<Tenant[]>([...mockTenants]);
  const [view, setView] = useState<View>('list');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | TenantStatus>('all');
  const [formData, setFormData] = useState<Partial<Tenant>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [newSite, setNewSite] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredTenants = tenants.filter((t) => {
    if (globalFilter !== 'all' && t.type !== globalFilter) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const openAdd = () => {
    const defaultType: TenantType = globalFilter === 'api' ? 'api' : globalFilter === 'wp' ? 'wp' : 'wp';
    setFormData(emptyTenant(defaultType));
    setIsEditing(false);
    setView('form');
  };

  const openEdit = (t: Tenant) => {
    setFormData({ ...t });
    setIsEditing(true);
    setView('form');
  };

  const openDetail = (t: Tenant) => {
    setSelectedTenant(t);
    setView('detail');
  };

  const toggleStatus = (t: Tenant) => {
    const newStatus: TenantStatus = t.status === 'active' ? 'suspended' : 'active';
    setTenants((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: newStatus } : x)));
  };

  const handleTypeChange = (type: TenantType) => {
    setFormData((prev) => ({
      ...emptyTenant(type),
      name: prev.name || '',
      email: prev.email || '',
      notes: prev.notes || '',
      status: prev.status || 'active',
      ...(isEditing ? { id: prev.id, createdAt: prev.createdAt } : {}),
    }));
  };

  const handlePlanChange = (plan: Plan) => {
    setFormData((prev) => {
      const next = { ...prev, plan };
      if (prev.type === 'api') {
        const included = planCallsIncluded[plan];
        if (included !== undefined) {
          next.callsIncluded = included;
        } else {
          delete next.callsIncluded;
        }
        if (plan === 'API - Per Call') {
          next.pricePerCall = prev.pricePerCall || 0.02;
        }
        if (plan === 'API - Enterprise') {
          next.customPrice = prev.customPrice || 0;
        }
      }
      return next;
    });
  };

  const saveForm = () => {
    if (!formData.name || !formData.email) return;
    if (isEditing && formData.id) {
      setTenants((prev) => prev.map((t) => (t.id === formData.id ? { ...t, ...formData } as Tenant : t)));
    } else {
      const newTenant: Tenant = {
        ...formData,
        id: `t${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as Tenant;
      setTenants((prev) => [...prev, newTenant]);
    }
    setView('list');
    setFormData({});
  };

  const addSite = () => {
    if (!newSite.trim()) return;
    setFormData((prev) => ({
      ...prev,
      licensedSites: [...(prev.licensedSites || []), newSite.trim()],
    }));
    setNewSite('');
  };

  const removeSite = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      licensedSites: (prev.licensedSites || []).filter((_, i) => i !== idx),
    }));
  };

  // ─── Detail view ───
  if (view === 'detail' && selectedTenant) {
    const t = tenants.find((x) => x.id === selectedTenant.id) || selectedTenant;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{t.name}</h1>
            <p className="text-sm text-slate-500">{t.email}</p>
          </div>
          <button onClick={() => openEdit(t)} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center gap-2">
            <Edit3 className="h-4 w-4" /> Edit
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailField label="Type" value={<TypeBadge type={t.type} />} />
            <DetailField label="Plan" value={t.plan} />
            <DetailField label="Status" value={<StatusBadge status={t.status} />} />
            <DetailField label="Created" value={formatDate(t.createdAt)} />
            <DetailField label="Notes" value={t.notes || '—'} />

            {t.type === 'wp' && (
              <>
                <DetailField label="License Key" value={<span className="font-mono text-xs">{t.licenseKey}</span>} />
                <DetailField label="License Status" value={<LicenseBadge status={t.licenseStatus!} />} />
                <DetailField label="License Expiry" value={t.licenseExpiry ? formatDate(t.licenseExpiry) : '—'} />
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Licensed Sites</p>
                  {t.licensedSites && t.licensedSites.length > 0 ? (
                    <ul className="space-y-1">
                      {t.licensedSites.map((s, i) => (
                        <li key={i} className="text-sm text-blue-600">{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400">None</p>
                  )}
                </div>
              </>
            )}

            {t.type === 'api' && (
              <>
                <DetailField label="Org Name" value={t.orgName || '—'} />
                <DetailField label="Billing Cycle" value={t.billingCycle ? t.billingCycle.charAt(0).toUpperCase() + t.billingCycle.slice(1) : '—'} />
                <DetailField label="API Key (partial)" value={<span className="font-mono text-xs">{t.apiKeyHalf}...</span>} />
                {t.plan === 'API - Per Call' && (
                  <>
                    <DetailField label="Price Per Call" value={`$${t.pricePerCall?.toFixed(3) || '0.020'}`} />
                    <DetailField label="Calls This Month" value={(t.callsThisMonth || 0).toLocaleString()} />
                  </>
                )}
                {['API - Starter', 'API - Growth', 'API - Business'].includes(t.plan) && (
                  <>
                    <DetailField label="Calls Included" value={(t.callsIncluded || 0).toLocaleString()} />
                    <DetailField label="Calls Used" value={(t.callsUsed || 0).toLocaleString()} />
                    <div className="sm:col-span-2 lg:col-span-3">
                      <p className="text-xs font-medium text-slate-500 uppercase mb-1">Usage</p>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 mt-1">
                        <div
                          className={`h-2.5 rounded-full ${(t.callsUsed || 0) > (t.callsIncluded || 1) ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, ((t.callsUsed || 0) / (t.callsIncluded || 1)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{((t.callsUsed || 0) / (t.callsIncluded || 1) * 100).toFixed(1)}% used</p>
                    </div>
                  </>
                )}
                {t.plan === 'API - Enterprise' && (
                  <DetailField label="Custom Price" value={`$${(t.customPrice || 0).toLocaleString()}/mo`} />
                )}
                {t.plan === 'API - Unlimited' && (
                  <DetailField label="Calls This Month" value={(t.callsThisMonth || 0).toLocaleString()} />
                )}
                {t.resetDate && <DetailField label="Reset Date" value={formatDate(t.resetDate)} />}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Add/Edit form ───
  if (view === 'form') {
    const currentType = formData.type || 'wp';
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Tenant' : 'Add Tenant'}</h1>
        </div>

        {/* Modal-style card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl">
          {/* Type toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Customer Type</label>
            <div className="flex gap-2">
              {(['wp', 'api'] as TenantType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    currentType === type
                      ? type === 'wp' ? 'bg-blue-600 text-white border-blue-600' : 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {type === 'wp' ? 'WordPress' : 'API'}
                </button>
              ))}
            </div>
          </div>

          {/* Shared fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <FormField label="Name" value={formData.name || ''} onChange={(v) => setFormData((p) => ({ ...p, name: v }))} />
            <FormField label="Email" value={formData.email || ''} onChange={(v) => setFormData((p) => ({ ...p, email: v }))} type="email" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as TenantStatus }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* WP fields */}
          {currentType === 'wp' && (
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">WordPress Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                  <select
                    value={formData.plan || 'WP - Standard'}
                    onChange={(e) => handlePlanChange(e.target.value as Plan)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {wpPlans.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <FormField label="License Key" value={formData.licenseKey || ''} readOnly />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Status</label>
                  <select
                    value={formData.licenseStatus || 'active'}
                    onChange={(e) => setFormData((p) => ({ ...p, licenseStatus: e.target.value as LicenseStatus }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <FormField
                  label="License Expiry"
                  value={formData.licenseExpiry ? formData.licenseExpiry.slice(0, 10) : ''}
                  onChange={(v) => setFormData((p) => ({ ...p, licenseExpiry: v ? `${v}T00:00:00Z` : '' }))}
                  type="date"
                />
              </div>

              {/* Licensed sites */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Licensed Sites</label>
                <div className="space-y-2">
                  {(formData.licensedSites || []).map((site, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">{site}</span>
                      <button onClick={() => removeSite(i)} className="p-1 text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSite}
                      onChange={(e) => setNewSite(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSite())}
                      placeholder="https://example.com"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button onClick={addSite} className="px-3 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200">Add</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API fields */}
          {currentType === 'api' && (
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">API Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Org Name" value={formData.orgName || ''} onChange={(v) => setFormData((p) => ({ ...p, orgName: v }))} />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                  <select
                    value={formData.plan || 'API - Per Call'}
                    onChange={(e) => handlePlanChange(e.target.value as Plan)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {apiPlans.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Cycle</label>
                  <select
                    value={formData.billingCycle || 'monthly'}
                    onChange={(e) => setFormData((p) => ({ ...p, billingCycle: e.target.value as BillingCycle }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <FormField label="API Key (partial)" value={formData.apiKeyHalf || ''} readOnly />

                {/* Plan-specific fields */}
                {formData.plan === 'API - Per Call' && (
                  <FormField
                    label="Price Per Call ($)"
                    value={String(formData.pricePerCall ?? 0.02)}
                    onChange={(v) => setFormData((p) => ({ ...p, pricePerCall: parseFloat(v) || 0 }))}
                    type="number"
                  />
                )}
                {['API - Starter', 'API - Growth', 'API - Business'].includes(formData.plan || '') && (
                  <>
                    <FormField label="Calls Included" value={String(formData.callsIncluded || 0)} readOnly />
                    <FormField
                      label="Calls Used"
                      value={String(formData.callsUsed ?? 0)}
                      onChange={(v) => setFormData((p) => ({ ...p, callsUsed: parseInt(v) || 0, callsThisMonth: parseInt(v) || 0 }))}
                      type="number"
                    />
                  </>
                )}
                {formData.plan === 'API - Enterprise' && (
                  <FormField
                    label="Custom Price ($/mo)"
                    value={String(formData.customPrice ?? 0)}
                    onChange={(v) => setFormData((p) => ({ ...p, customPrice: parseFloat(v) || 0 }))}
                    type="number"
                  />
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={saveForm} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
              {isEditing ? 'Save Changes' : 'Create Tenant'}
            </button>
            <button onClick={() => setView('list')} className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── List view ───
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Management</h1>
          <p className="text-sm text-slate-500 mt-1">{filteredTenants.length} tenants</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
          {(['all', 'active', 'suspended', 'cancelled'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                filterStatus === v ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {v === 'all' ? 'All Status' : v}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-2 py-2.5 w-8"></th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((t) => {
                const isExpanded = expandedId === t.id;
                return (
                  <React.Fragment key={t.id}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : t.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{t.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{t.email}</td>
                      <td className="px-4 py-3"><TypeBadge type={t.type} /></td>
                      <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{displayPlan(t.plan)}</td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDetail(t)} className="p-1.5 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded text-blue-500 hover:text-blue-700 hover:bg-slate-100" title="Edit">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(t)}
                            className={`p-1.5 rounded hover:bg-slate-100 ${
                              t.status === 'active' ? 'text-amber-500 hover:text-amber-600' : 'text-green-500 hover:text-green-600'
                            }`}
                            title={t.status === 'active' ? 'Suspend' : 'Activate'}
                          >
                            {t.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase">Total Sessions</p>
                              <p className="text-sm font-semibold text-slate-900">{t.sessionCount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase">Success Rate</p>
                              <p className="text-sm font-semibold text-slate-900">{t.successRate}%</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase">Last Activity</p>
                              <p className="text-sm text-slate-700">{formatDate(t.lastActivity)}</p>
                            </div>
                          </div>
                          {t.type === 'wp' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Licensed Sites</p>
                                {t.licensedSites && t.licensedSites.length > 0 ? (
                                  <ul className="space-y-0.5">
                                    {t.licensedSites.map((s, i) => (
                                      <li key={i} className="text-xs text-blue-600">{s}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-slate-400">None</p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">License Expiry</p>
                                <p className="text-sm text-slate-700">{t.licenseExpiry ? formatDate(t.licenseExpiry) : '--'}</p>
                              </div>
                            </div>
                          )}
                          {t.type === 'api' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200">
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Calls Used / Included</p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {(t.callsUsed || t.callsThisMonth || 0).toLocaleString()}
                                  {t.callsIncluded ? ` / ${t.callsIncluded.toLocaleString()}` : ''}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Billing Cycle</p>
                                <p className="text-sm text-slate-700 capitalize">{t.billingCycle || '--'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Overage</p>
                                {t.callsIncluded && (t.callsUsed || 0) > t.callsIncluded ? (
                                  <p className="text-sm font-semibold text-red-600">+{((t.callsUsed || 0) - t.callsIncluded).toLocaleString()} calls</p>
                                ) : (
                                  <p className="text-sm text-green-600">None</p>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">No tenants found.</td>
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

function TypeBadge({ type }: { type: TenantType }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      type === 'wp' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
    }`}>
      {type === 'wp' ? 'WP' : 'API'}
    </span>
  );
}

function StatusBadge({ status }: { status: TenantStatus }) {
  const colors: Record<TenantStatus, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  const dots: Record<TenantStatus, string> = {
    active: 'bg-green-500',
    suspended: 'bg-yellow-500',
    cancelled: 'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
}

function LicenseBadge({ status }: { status: LicenseStatus }) {
  const colors: Record<LicenseStatus, string> = {
    active: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700',
    suspended: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[status]}`}>
      {status}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase mb-1">{label}</p>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  );
}

function FormField({
  label, value, onChange, type = 'text', readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
          readOnly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}
