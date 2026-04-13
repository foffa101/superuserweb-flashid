import { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { getFieldAgentForAction, saveFieldAgent, deleteFieldAgent, type FieldAgent } from '../lib/firestore';
import { auth } from '../lib/firebase';

interface FieldAgentIconProps {
  action: string;
  actionLabel: string;
  page: string;
}

export function FieldAgentIcon({ action, actionLabel, page }: FieldAgentIconProps) {
  const [agent, setAgent] = useState<FieldAgent | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFieldAgentForAction(action).then((a) => {
      setAgent(a);
      if (a) {
        setNotifyEmail(a.notifyEmail);
        setEnabled(a.enabled);
      }
    });
  }, [action]);

  const isActive = agent?.enabled === true;

  const handleSave = async () => {
    setSaving(true);
    const user = auth.currentUser;
    const agentData: FieldAgent = {
      id: action,
      action,
      actionLabel,
      page,
      notifyEmail: notifyEmail || user?.email || '',
      notifyUid: user?.uid || '',
      enabled,
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
      setNotifyEmail('');
      setEnabled(true);
    }
    setShowPopup(false);
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowPopup(!showPopup); }}
        className={`p-1 rounded-md transition-all ${
          isActive
            ? 'text-[#00F5D4] animate-pulse hover:bg-[#00F5D4]/10'
            : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
        }`}
        title={isActive ? `Field Agent active: ${agent?.notifyEmail}` : 'Set up Field Agent'}
      >
        <Shield className="h-4 w-4" />
      </button>

      {showPopup && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPopup(false)} />
          <div className="absolute right-0 top-8 z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#00F5D4]" />
                <span className="text-sm font-semibold text-slate-900">Field Agent</span>
              </div>
              <button onClick={() => setShowPopup(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Action</p>
              <p className="text-sm font-medium text-slate-900">{actionLabel}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Page</p>
              <p className="text-sm text-slate-700 capitalize">{page.replace(/_/g, ' ')}</p>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Notify (email)</label>
              <input
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder={auth.currentUser?.email || 'email@example.com'}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00F5D4] focus:border-[#00F5D4]"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-[#00F5D4]"
              />
              <span className="text-sm text-slate-700">Enabled</span>
            </label>

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
