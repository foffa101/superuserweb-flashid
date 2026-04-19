import { useState, useEffect } from 'react';
import { Shield, Trash2, Loader2, Pencil, X } from 'lucide-react';
import { getFieldAgents, deleteFieldAgent, saveFieldAgent, FIELD_AGENT_SCOPES, type FieldAgent } from '../../lib/firestore';

export default function FieldAgents() {
  const [fieldAgents, setFieldAgents] = useState<FieldAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FieldAgent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getFieldAgents().then((agents) => { setFieldAgents(agents); setLoading(false); }); }, []);

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      await saveFieldAgent(editing);
      setFieldAgents((prev) => prev.map((a) => (a.id === editing.id ? editing : a)));
      setEditing(null);
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading Field Agents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {fieldAgents.length === 0 ? (
          <p className="text-sm text-slate-400">No field agents configured yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {fieldAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${agent.enabled ? 'bg-[#00F5D4]/10' : 'bg-slate-100'}`}>
                    <Shield className={`h-4 w-4 ${agent.enabled ? 'text-[#00F5D4]' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{agent.actionLabel}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400 capitalize">{agent.page?.replace(/_/g, ' ')}</p>
                      {agent.scope && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 text-[10px] font-medium">{agent.scope}</span>
                      )}
                    </div>
                    {agent.notifyEmails && agent.notifyEmails.length > 0 && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Notifies: {agent.notifyEmails.join(', ')}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Timeout: {agent.timeoutSeconds === 0 ? 'Does not expire' : agent.timeoutSeconds < 60 ? `${agent.timeoutSeconds}s` : agent.timeoutSeconds < 3600 ? `${Math.floor(agent.timeoutSeconds / 60)}m` : agent.timeoutSeconds < 86400 ? `${Math.floor(agent.timeoutSeconds / 3600)}h` : `${Math.floor(agent.timeoutSeconds / 86400)}d`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${agent.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {agent.enabled ? 'Active' : 'Paused'}
                  </span>
                  <button
                    onClick={() => setEditing({ ...agent })}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Edit agent"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      await deleteFieldAgent(agent.id);
                      setFieldAgents((prev) => prev.filter((a) => a.id !== agent.id));
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove agent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => !saving && setEditing(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Edit Field Agent</h3>
              <button onClick={() => !saving && setEditing(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                <input
                  type="text"
                  value={editing.actionLabel}
                  onChange={(e) => setEditing({ ...editing, actionLabel: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Scope</label>
                <select
                  value={editing.scope}
                  onChange={(e) => setEditing({ ...editing, scope: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FIELD_AGENT_SCOPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notify Emails (comma-separated)</label>
                <input
                  type="text"
                  value={editing.notifyEmails?.join(', ') ?? ''}
                  onChange={(e) => setEditing({ ...editing, notifyEmails: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Timeout (seconds — 0 for no expiry)</label>
                <input
                  type="number"
                  min={0}
                  value={editing.timeoutSeconds}
                  onChange={(e) => setEditing({ ...editing, timeoutSeconds: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.enabled}
                  onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Enabled</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => !saving && setEditing(null)}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editing.actionLabel.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
