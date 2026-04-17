import { Clock } from 'lucide-react';

export default function VerificationQueue() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-sm text-slate-500">Verification queue coming in Phase 2.</p>
        <p className="text-xs text-slate-400 mt-1">For POC, tenants are approved instantly via Business Agents page.</p>
      </div>
    </div>
  );
}
