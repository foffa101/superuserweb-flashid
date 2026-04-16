import { useState, useEffect } from 'react';
import { Building2, Plus, CheckCircle, Clock, X } from 'lucide-react';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { app } from '../../lib/firebase';

const db = getFirestore(app, 'ai-studio-5104b9c1-7e74-4c52-9bdf-6e57ed9d5d3c');

interface Tenant {
  id: string;
  name: string;
  type: string;
  status: 'verified' | 'pending';
  createdAt: string;
  createdBy: string;
  adminEmail?: string;
}

export default function BusinessAgents() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
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
    if (!newTenantName.trim() || !newAdminEmail.trim()) return;
    setCreating(true);
    try {
      const tenantId = `tenant_${Date.now()}`;
      await setDoc(doc(db, 'tenants', tenantId), {
        name: newTenantName.trim(),
        type: 'business',
        status: 'pending',
        adminEmail: newAdminEmail.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
        createdBy: 'superuser',
      });
      setShowCreateModal(false);
      setNewTenantName('');
      setNewAdminEmail('');
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
                    {tenant.adminEmail && (
                      <p className="text-xs text-slate-400">{tenant.adminEmail}</p>
                    )}
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
              <button
                onClick={createTenant}
                disabled={creating || !newTenantName.trim() || !newAdminEmail.trim()}
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
