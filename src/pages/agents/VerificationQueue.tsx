import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

interface QueueItem {
  id: string;
  agentName: string;
  orgName: string;
  email: string;
  type: 'kyc' | 'kya';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  riskLevel: 'low' | 'medium' | 'high';
  notes: string;
}

const dummyQueue: QueueItem[] = [
  { id: 'vq1', agentName: 'PaymentBot Pro', orgName: 'FinTech Solutions Inc.', email: 'compliance@fintechsol.com', type: 'kya', status: 'pending', submittedAt: '2026-04-17T14:30:00Z', riskLevel: 'medium', notes: 'Payment processing agent — requires PCI compliance review' },
  { id: 'vq2', agentName: 'HealthAssist AI', orgName: 'MedRx Technologies', email: 'admin@medrx.com', type: 'kya', status: 'pending', submittedAt: '2026-04-16T09:15:00Z', riskLevel: 'high', notes: 'Medical data access — HIPAA compliance required' },
  { id: 'vq3', agentName: 'TravelBot', orgName: 'Wanderlust Corp', email: 'ops@wanderlust.io', type: 'kyc', status: 'pending', submittedAt: '2026-04-18T11:00:00Z', riskLevel: 'low', notes: 'Travel booking agent — standard verification' },
  { id: 'vq4', agentName: 'InsureBot', orgName: 'SafeGuard Insurance', email: 'tech@safeguard.com', type: 'kya', status: 'approved', submittedAt: '2026-04-10T08:00:00Z', riskLevel: 'medium', notes: 'Insurance claims processing — approved after compliance review' },
  { id: 'vq5', agentName: 'CryptoSwapBot', orgName: 'Unknown Entity', email: 'contact@cryptoswap.xyz', type: 'kyc', status: 'rejected', submittedAt: '2026-04-12T16:45:00Z', riskLevel: 'high', notes: 'Rejected — unable to verify organization identity' },
];

const riskColors = { low: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' };
const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending Review' },
  approved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected' },
};

export default function VerificationQueue() {
  const [items, setItems] = useState(dummyQueue);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const pendingCount = items.filter(i => i.status === 'pending').length;

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: action } : i));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      {/* Filter pills */}
      <div className="flex items-center gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? `All (${items.length})` : f === 'pending' ? `Pending (${pendingCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-sm text-slate-500">No items in this queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const sc = statusConfig[item.status];
            const StatusIcon = sc.icon;
            return (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${sc.bg}`}>
                      <StatusIcon className={`h-5 w-5 ${sc.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{item.agentName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${riskColors[item.riskLevel]}`}>{item.riskLevel} risk</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500">{item.type.toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.orgName} &middot; {item.email}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.notes}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Submitted {new Date(item.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(item.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'approved')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                  {item.status !== 'pending' && (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${sc.bg} ${sc.color}`}>{sc.label}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
