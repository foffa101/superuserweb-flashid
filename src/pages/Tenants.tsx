import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Eye, Edit3, Ban, CheckCircle, ArrowLeft, X,
  ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, Lock,
} from 'lucide-react';
import { FieldAgentIcon } from '../components/FieldAgentIcon';
import { useFieldAgentGuard } from '../components/FieldAgentGuard';
import { ApprovalOverlay } from '../components/ApprovalOverlay';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import {
  db,
  getTenants as fetchTenants,
  getTenantAdminLogins,
  createTenant,
  updateTenant as firestoreUpdateTenant,
  seedInitialData,
  type TenantAdminLogin,
} from '../lib/firestore';
import {
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

function formatLastLogin(iso?: string, tz?: string): string {
  if (!iso) return 'Never';
  try {
    const d = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZoneName: 'short',
    };
    if (tz) opts.timeZone = tz;
    const formatted = d.toLocaleString('en-US', opts);
    // Format: "14-Apr-2026 @ 2:30 PM (EST)"
    const parts = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', ...(tz ? { timeZone: tz } : {}) });
    const timeParts = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, ...(tz ? { timeZone: tz } : {}) });
    const tzAbbr = d.toLocaleTimeString('en-US', { timeZoneName: 'short', ...(tz ? { timeZone: tz } : {}) }).split(' ').pop() || '';
    // parts = "Apr 14, 2026" -> rearrange to "14-Apr-2026"
    const m = parts.match(/([A-Za-z]+)\s+(\d+),?\s+(\d+)/);
    const dateStr = m ? `${m[2]}-${m[1]}-${m[3]}` : parts;
    return `${dateStr} @ ${timeParts} (${tzAbbr})`;
  } catch {
    return iso;
  }
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
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | TenantStatus>('all');
  const [formData, setFormData] = useState<Partial<Tenant>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [newSite, setNewSite] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminWhitelist, setAdminWhitelist] = useState<string[]>([]);
  const [adminLogins, setAdminLogins] = useState<TenantAdminLogin[]>([]);

  // Field Agent guards
  const addTenantGuard = useFieldAgentGuard('add_tenant');
  const editTenantGuard = useFieldAgentGuard('edit_tenant');

  // Load tenants from Firestore
  useEffect(() => {
    async function load() {
      await seedInitialData();
      const [data, logins] = await Promise.all([fetchTenants(), getTenantAdminLogins()]);
      setTenants(data);
      setAdminLogins(logins);
      setLoading(false);
    }
    load();
  }, []);

  // Load admin whitelist from Firestore
  useEffect(() => {
    getDoc(doc(db, 'admin_config', 'whitelist')).then((snap) => {
      if (snap.exists()) {
        setAdminWhitelist(snap.data().emails || []);
      }
    }).catch(() => {});
  }, []);

  const toggleAdminAccess = async (email: string, grant: boolean) => {
    const updated = grant
      ? [...adminWhitelist.filter(e => e !== email.toLowerCase()), email.toLowerCase()]
      : adminWhitelist.filter(e => e !== email.toLowerCase());
    setAdminWhitelist(updated);
    try {
      await setDoc(doc(db, 'admin_config', 'whitelist'), { emails: updated });
    } catch (e) {
      console.error('Failed to update admin whitelist:', e);
    }
  };

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

  const toggleStatus = async (t: Tenant) => {
    const newStatus: TenantStatus = t.status === 'active' ? 'suspended' : 'active';
    setTenants((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: newStatus } : x)));
    try {
      await firestoreUpdateTenant(t.id, { status: newStatus });
    } catch (e) {
      console.error('Failed to update tenant status:', e);
    }
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
    // Warn when downgrading from Agency → Standard
    if (isEditing && formData.plan === 'WP - Agency' && plan === 'WP - Standard') {
      const extraSites = (formData.licensedSites || []).slice(1);
      const msg = extraSites.length > 0
        ? `Downgrading to WP Standard will delete ${extraSites.length} additional domain(s):\n\n${extraSites.join('\n')}\n\nAdmin portal access will also be revoked. Continue?`
        : 'Downgrading to WP Standard will revoke admin portal access. Continue?';
      if (!confirm(msg)) return;
      // Strip additional domains, keep only primary
      setFormData((prev) => ({
        ...prev,
        plan,
        licensedSites: prev.licensedSites?.slice(0, 1) || [],
        enrollmentModes: {},
        redirectUrls: {},
      }));
      // Revoke admin portal access
      if (formData.email) {
        toggleAdminAccess(formData.email, false);
        // Remove tenant_admins record
        const q = query(collection(db, 'tenant_admins'), where('email', '==', formData.email.toLowerCase()));
        getDocs(q).then((snap) => {
          snap.docs.forEach((d) => deleteDoc(d.ref));
        }).catch(() => {});
      }
      return;
    }
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

  const saveForm = async () => {
    if (!formData.name || !formData.email) return;
    // WP tenants require at least a primary domain
    if ((formData.type === 'wp') && (!formData.licensedSites || formData.licensedSites.length === 0 || !formData.licensedSites[0]?.trim())) {
      alert('Primary domain is required for WordPress tenants.');
      return;
    }
    // Enforce single domain for WP Standard
    if (formData.plan === 'WP - Standard' && formData.licensedSites && formData.licensedSites.length > 1) {
      formData.licensedSites = formData.licensedSites.slice(0, 1);
    }
    if (isEditing && formData.id) {
      setTenants((prev) => prev.map((t) => (t.id === formData.id ? { ...t, ...formData } as Tenant : t)));
      try {
        await firestoreUpdateTenant(formData.id, formData);
      } catch (e) {
        console.error('Failed to update tenant:', e);
      }
    } else {
      const newTenant: Tenant = {
        ...formData,
        id: `t${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as Tenant;
      setTenants((prev) => [...prev, newTenant]);
      try {
        await createTenant(newTenant);
      } catch (e) {
        console.error('Failed to create tenant:', e);
      }
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

              {/* Primary Domain — required, read-only after creation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Primary Domain <span className="text-red-500">*</span>
                </label>
                {isEditing && (formData.licensedSites || []).length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-slate-700 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 font-mono">
                      {(formData.licensedSites || [])[0]}
                    </span>
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                ) : !isEditing ? (
                  <input
                    type="text"
                    value={(formData.licensedSites || [])[0] || newSite}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewSite(val);
                      setFormData((p) => ({ ...p, licensedSites: [val, ...(p.licensedSites || []).slice(1)] }));
                    }}
                    placeholder="example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                ) : (
                  <input
                    type="text"
                    value={newSite}
                    onChange={(e) => {
                      setNewSite(e.target.value);
                      setFormData((p) => ({ ...p, licensedSites: [e.target.value] }));
                    }}
                    placeholder="example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                )}
                <p className="text-xs text-slate-400 mt-1">The primary domain is set once and shown as read-only in the Admin Portal</p>
              </div>

              {/* Additional licensed sites (Agency only) */}
              {formData.plan === 'WP - Agency' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Additional Domains</label>
                <div className="space-y-2">
                  {(formData.licensedSites || []).slice(1).map((site, i) => (
                    <div key={i + 1} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">{site}</span>
                      <button onClick={() => removeSite(i + 1)} className="p-1 text-red-500 hover:text-red-700">
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
              )}
              {formData.plan === 'WP - Standard' && (formData.licensedSites || []).length > 1 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">WP Standard plans support a single domain only. Additional domains will be removed on save.</p>
                </div>
              )}
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

          {/* Admin Portal Access */}
          {formData.email && (() => {
            const isWpStandard = formData.plan === 'WP - Standard';
            const isChecked = adminWhitelist.includes((formData.email || '').toLowerCase());
            return (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label
                  className={`flex items-center gap-3 ${isWpStandard ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  onClick={(e) => {
                    if (isWpStandard) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked && !isWpStandard}
                    disabled={isWpStandard}
                    onChange={(e) => {
                      if (!isWpStandard) toggleAdminAccess(formData.email || '', e.target.checked);
                    }}
                    className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500 accent-red-600"
                  />
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`h-5 w-5 ${isWpStandard ? 'text-slate-400' : 'text-indigo-500'}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Create Admin Portal</p>
                      <p className="text-xs text-slate-400">Grant <span className="font-medium text-slate-600">{formData.email}</span> access to the Admin Portal (flashid-admin.web.app)</p>
                    </div>
                  </div>
                </label>
                {isWpStandard && (
                  <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Administrator Portals are not available for WP Standard plans. Standard plans are governed from within the WordPress environment. Change the plan to WP Agency or an API plan to enable portal access.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Approval overlays */}
          {addTenantGuard.status !== 'idle' && addTenantGuard.status !== 'checking' && <ApprovalOverlay status={addTenantGuard.status} onCancel={addTenantGuard.reset} />}
          {editTenantGuard.status !== 'idle' && editTenantGuard.status !== 'checking' && <ApprovalOverlay status={editTenantGuard.status} onCancel={editTenantGuard.reset} />}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const guard = isEditing ? editTenantGuard : addTenantGuard;
                  guard.executeWithGuard(
                    `${isEditing ? 'Edit' : 'Add'} Tenant: ${formData.name}`,
                    () => saveForm(),
                    'tenants',
                    isEditing ? 'Edit Tenant' : 'Add Tenant',
                  );
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                {isEditing ? 'Save Changes' : 'Create Tenant'}
              </button>
              <FieldAgentIcon action={isEditing ? 'edit_tenant' : 'add_tenant'} actionLabel={isEditing ? 'Edit Tenant' : 'Add Tenant'} page="tenants" />
            </div>
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
        <p className="text-sm text-slate-500">{filteredTenants.length} tenants</p>
        <div className="flex items-center gap-2">
          <button onClick={openAdd} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Tenant
          </button>
          <FieldAgentIcon action="add_tenant" actionLabel="Add Tenant" page="tenants" />
        </div>
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
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Last Login</th>
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
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {t.name}
                          <FieldAgentIcon action="toggle_tenant_status" actionLabel="Change Tenant Status" page="tenants" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{t.email}</td>
                      <td className="px-4 py-3"><TypeBadge type={t.type} /></td>
                      <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{displayPlan(t.plan)}</td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {(() => {
                          const login = adminLogins.find(a => a.tenantId === t.id || a.email === t.email?.toLowerCase());
                          return formatLastLogin(login?.lastLogin, login?.lastLoginTimezone);
                        })()}
                      </td>
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
                        <td colSpan={9} className="px-6 py-4">
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
              {loading && filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                      <span className="text-sm">Loading tenants...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">No tenants found.</td>
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
