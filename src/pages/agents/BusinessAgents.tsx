import { useState, useEffect } from 'react';
import { Building2, Plus, CheckCircle, Clock, X, AlertTriangle } from 'lucide-react';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { app } from '../../lib/firebase';

const db = getFirestore(app, 'ai-studio-5104b9c1-7e74-4c52-9bdf-6e57ed9d5d3c');

type CustomerType = 'wp_standard' | 'wp_agency';

interface Tenant {
  id: string;
  name: string;
  type: string;
  status: 'verified' | 'pending';
  createdAt: string;
  createdBy: string;
  adminEmail?: string;
  customerType?: CustomerType;
  domain?: string;
}

export default function BusinessAgents() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newCustomerType, setNewCustomerType] = useState<CustomerType>('wp_standard');
  const [newDomain, setNewDomain] = useState('');
  const [enableAdminPortal, setEnableAdminPortal] = useState(false);
  const [showStandardWarning, setShowStandardWarning] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadTenants = async () => {
    try {
      const snap = await getDocs(collection(db, 'tenants'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Tenant));
      setTenants(list.sort((a, b) => b.createdAt?.localeCompare(a.createdAt || '') || 0));
    } catch (e) {
      console.error('Failed to load tenants:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTenants(); }, []);

  const createTenant = async () => {
    if (!newTenantName.trim() || !newAdminEmail.trim() || !newDomain.trim()) return;
    setCreating(true);
    try {
      const tenantId = `tenant_${Date.now()}`;
      const email = newAdminEmail.trim().toLowerCase();
      const domain = newDomain.trim().toLowerCase();

      // 1. Create the tenant record
      await setDoc(doc(db, 'tenants', tenantId), {
        name: newTenantName.trim(),
        type: 'business',
        customerType: newCustomerType,
        status: 'pending',
        adminEmail: email,
        domain,
        domains: [domain],
        createdAt: new Date().toISOString(),
        createdBy: 'superuser',
      });

      // 2. Only grant admin portal access for WP Agency plans
      if (enableAdminPortal && newCustomerType === 'wp_agency') {
        // Add admin email to whitelist so they can access admin portal
        const whitelistRef = doc(db, 'admin_config', 'whitelist');
        const whitelistSnap = await getDoc(whitelistRef);
        if (whitelistSnap.exists()) {
          await setDoc(whitelistRef, { emails: arrayUnion(email) }, { merge: true });
        } else {
          await setDoc(whitelistRef, { emails: [email] });
        }

        // Create tenant_admins record so admin portal can look up their tenantId
        await setDoc(doc(db, 'tenant_admins', `${tenantId}_${email.replace(/[^a-z0-9]/g, '_')}`), {
          email,
          tenantId,
        });
      }

      setShowCreateModal(false);
      setNewTenantName('');
      setNewAdminEmail('');
      setNewDomain('');
      setNewCustomerType('wp_standard');
      setEnableAdminPortal(false);
      await loadTenants();
    } catch (e) {
      console.error('Failed to create tenant:', e);
    } finally {
      setCreating(false);
    }
  };

  const approveTenant = async (tenantId: string) => {
    try {
      await setDoc(doc(db, 'tenants', tenantId), { status: 'verified' }, { merge: true });
      setTenants((prev) => prev.map((t) => t.id === tenantId ? { ...t, status: 'verified' } : t));
    } catch (e) {
      console.error('Failed to approve tenant:', e);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Agents</h1>
          <p className="text-sm text-slate-500 mt-1">Manage business tenants and their agent registrations.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00F5D4] text-slate-900 rounded-lg font-medium text-sm hover:bg-[#00F5D4]/80 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Tenant
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading tenants...</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No business tenants yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tenant.status === 'verified' ? 'bg-green-50' : 'bg-amber-50'}`}>
                    <Building2 className={`h-5 w-5 ${tenant.status === 'verified' ? 'text-green-600' : 'text-amber-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{tenant.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {tenant.adminEmail && (
                        <span className="text-xs text-slate-400">{tenant.adminEmail}</span>
                      )}
                      {tenant.customerType && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tenant.customerType === 'wp_agency' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                          {tenant.customerType === 'wp_agency' ? 'WP Agency' : 'WP Standard'}
                        </span>
                      )}
                      {tenant.domain && (
                        <span className="text-[10px] text-slate-400">{tenant.domain}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Created {new Date(tenant.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tenant.status === 'verified' ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                      <button
                        onClick={() => approveTenant(tenant.id)}
                        className="px-3 py-1 bg-[#00F5D4] text-slate-900 rounded-lg text-xs font-medium hover:bg-[#00F5D4]/80 transition-colors"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Create Tenant</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="e.g. Pizza Hut"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00F5D4]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@business.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00F5D4]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Domain</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="business.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00F5D4]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Type</label>
                <div className="flex gap-2">
                  {([['wp_standard', 'WP Standard'], ['wp_agency', 'WP Agency']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => {
                        setNewCustomerType(val);
                        setEnableAdminPortal(val === 'wp_agency');
                        setShowStandardWarning(false);
                      }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newCustomerType === val
                          ? 'bg-[#00F5D4] text-slate-900'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {newCustomerType === 'wp_standard' ? 'Single domain — managed from within WordPress' : 'Agency — admin can add up to 5 domains via Admin Portal'}
                </p>
              </div>

              {/* Create Admin Portal checkbox */}
              <div>
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    enableAdminPortal ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:bg-slate-50'
                  } ${newCustomerType === 'wp_standard' ? 'opacity-60' : ''}`}
                  onClick={(e) => {
                    if (newCustomerType === 'wp_standard') {
                      e.preventDefault();
                      setShowStandardWarning(true);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={enableAdminPortal}
                    onChange={(e) => {
                      if (newCustomerType === 'wp_standard') {
                        e.preventDefault();
                        setShowStandardWarning(true);
                        return;
                      }
                      setEnableAdminPortal(e.target.checked);
                    }}
                    disabled={newCustomerType === 'wp_standard'}
                    className="accent-green-600 w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Create Admin Portal Access</p>
                    <p className="text-xs text-slate-400">Grant this admin access to the Flash ID Admin Portal</p>
                  </div>
                </label>
                {showStandardWarning && (
                  <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Administrator Portals are not allowed for WP Standard plans. Standard plans are governed from within the WordPress environment.
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={createTenant}
                disabled={creating || !newTenantName.trim() || !newAdminEmail.trim() || !newDomain.trim()}
                className="w-full py-2 bg-[#00F5D4] text-slate-900 rounded-lg font-medium text-sm hover:bg-[#00F5D4]/80 transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Tenant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
