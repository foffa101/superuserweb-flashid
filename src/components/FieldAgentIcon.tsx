import { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { getFieldAgentForAction, saveFieldAgent, deleteFieldAgent, FIELD_AGENT_SCOPES, type FieldAgent } from '../lib/firestore';
import { auth } from '../lib/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../lib/firebase';

const db = getFirestore(app, 'ai-studio-5104b9c1-7e74-4c52-9bdf-6e57ed9d5d3c');

const ACTION_LABEL_MAX = 40;

const FIELD_AGENT_TIMEOUTS = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 2700, label: '45 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 7200, label: '2 hours' },
  { value: 14400, label: '4 hours' },
  { value: 28800, label: '8 hours' },
  { value: 43200, label: '12 hours' },
  { value: 57600, label: '16 hours' },
  { value: 72000, label: '20 hours' },
  { value: 86400, label: '1 day' },
  { value: 172800, label: '2 days' },
  { value: 259200, label: '3 days' },
  { value: 604800, label: '7 days' },
  { value: 1209600, label: '2 weeks' },
  { value: 1814400, label: '3 weeks' },
  { value: 2419200, label: '4 weeks' },
  { value: 5184000, label: '2 months' },
  { value: 7776000, label: '3 months' },
  { value: 15552000, label: '6 months' },
  { value: 31536000, label: '12 months' },
  { value: 0, label: 'Does not expire' },
];

interface FieldAgentIconProps {
  action: string;
  actionLabel: string;
  page: string;
}

export function FieldAgentIcon({ action, actionLabel, page }: FieldAgentIconProps) {
  const [agent, setAgent] = useState<FieldAgent | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [editLabel, setEditLabel] = useState(actionLabel);
  const [scope, setScope] = useState('');
  const [notifyEmails, setNotifyEmails] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [timeoutSeconds, setTimeoutSeconds] = useState(120);
  const [saving, setSaving] = useState(false);
  const [whitelistEmails, setWhitelistEmails] = useState<string[]>([]);

  // Load whitelist emails from Access Management
  useEffect(() => {
    getDoc(doc(db, 'superadmin_config', 'whitelist')).then((snap) => {
      if (snap.exists()) setWhitelistEmails(snap.data().emails || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    getFieldAgentForAction(action).then((a) => {
      setAgent(a);
      if (a) {
        setEditLabel(a.actionLabel);
        setScope(a.scope || '');
        setNotifyEmails(a.notifyEmails || []);
        setEnabled(a.enabled);
        setTimeoutSeconds(a.timeoutSeconds || 120);
      } else {
        setEditLabel(actionLabel);
      }
    });
  }, [action, actionLabel]);

  const isActive = agent?.enabled === true;

  const toggleEmail = (email: string) => {
    setNotifyEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const user = auth.currentUser;
    const emails = notifyEmails.length > 0 ? notifyEmails : [user?.email || ''];
    const agentData: FieldAgent = {
      id: action,
      action,
      actionLabel: editLabel.slice(0, ACTION_LABEL_MAX),
      page,
      siteName: 'Flash ID Super Admin',
      scope,
      notifyEmails: emails,
      enabled,
      timeoutSeconds,
      createdBy: user?.email || '',
      createdAt: agent?.createdAt || new Date().toISOString(),
    };
    await saveFieldAgent(agentData);
    setAgent(agentData);
    setSaving(false);
    setShowPopup(false);
  };

  const handleDelete = async () => {
    if (agent) {
      await deleteFieldAgent(agent.id);
      setAgent(null);
      setEditLabel(actionLabel);
      setScope('');
      setNotifyEmails([]);
      setEnabled(true);
    }
    setShowPopup(false);
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowPopup(!showPopup); }}
        className={`p-1.5 rounded-lg transition-all ${
          isActive
            ? 'bg-[#00F5D4]/15 text-[#00F5D4]'
            : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
        }`}
        title={isActive ? `Field Agent active: ${agent?.notifyEmails?.join(', ')}` : 'Set up Field Agent'}
      >
        <Shield className="h-4 w-4" />
      </button>

      {showPopup && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowPopup(false)} />
          <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#00F5D4]" />
                <span className="text-sm font-semibold text-slate-900">Field Agent</span>
              </div>
              <button onClick={() => setShowPopup(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action Label — editable */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Action <span className="text-slate-300">({editLabel.length}/{ACTION_LABEL_MAX})</span></label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value.slice(0, ACTION_LABEL_MAX))}
                maxLength={ACTION_LABEL_MAX}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00F5D4] focus:border-[#00F5D4]"
              />
            </div>

            {/* Page */}
            <div>
              <p className="text-xs text-slate-500 mb-1">Page</p>
              <p className="text-sm text-slate-700 capitalize">{page.replace(/_/g, ' ')}</p>
            </div>

            {/* Scope dropdown */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00F5D4] focus:border-[#00F5D4]"
              >
                <option value="">None</option>
                {FIELD_AGENT_SCOPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Notify — multi-select from whitelist */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Notify</label>
              <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {whitelistEmails.length === 0 ? (
                  <p className="text-xs text-slate-400 p-2">No admins in Access Management</p>
                ) : (
                  whitelistEmails.map((email) => (
                    <label key={email} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyEmails.includes(email)}
                        onChange={() => toggleEmail(email)}
                        className="w-3.5 h-3.5 rounded accent-[#00F5D4]"
                      />
                      <span className="text-xs text-slate-700">{email}</span>
                    </label>
                  ))
                )}
              </div>
              {notifyEmails.length > 0 && (
                <p className="text-[10px] text-slate-400 mt-1">{notifyEmails.length} recipient{notifyEmails.length > 1 ? 's' : ''}</p>
              )}
            </div>

            {/* Timeout */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Timeout</label>
              <select
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00F5D4] focus:border-[#00F5D4]"
              >
                {FIELD_AGENT_TIMEOUTS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Enabled */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-[#00F5D4]"
              />
              <span className="text-sm text-slate-700">Enabled</span>
            </label>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              {agent && (
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
