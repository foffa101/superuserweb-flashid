import { useState, useEffect } from 'react';
import { Shield, Trash2 } from 'lucide-react';
import { getFieldAgents, deleteFieldAgent, type FieldAgent } from '../../lib/firestore';

export default function FieldAgents() {
  const [fieldAgents, setFieldAgents] = useState<FieldAgent[]>([]);

  useEffect(() => { getFieldAgents().then(setFieldAgents); }, []);

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
    </div>
  );
}
