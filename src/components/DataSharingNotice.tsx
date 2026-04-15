import { Lock, Loader2 } from 'lucide-react';

interface DataSharingNoticeProps {
  siteName: string;
}

/**
 * First-time pairing notice. Shown on the browser while the phone is on the
 * ApprovalScreen reading the data-sharing disclosure. Purely informational —
 * the legally meaningful consent happens on the phone, so this panel has no
 * Accept button. Content mirrors the phone copy so the user sees parity
 * across both screens before approving.
 *
 * Design notes:
 *  - Four data categories listed explicitly (no "account data" catch-all).
 *  - Biometric-locality callout is prominent — required framing for
 *    jurisdictions that regulate biometric storage.
 *  - Purpose (identity verification when signing in) and revocability
 *    (disconnect from the app) are stated in plain English.
 */
export function DataSharingNotice({ siteName }: DataSharingNoticeProps) {
  const site = siteName || 'this site';
  return (
    <div className="text-left space-y-4 px-1">
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none">🔐</span>
        <h3 className="text-lg font-bold text-slate-900">Connect to {site}</h3>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
        <span className="font-semibold">{site}</span> is requesting to connect with your Flash ID.
        They will receive:
      </p>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-slate-700">
        <li className="flex items-center gap-2"><span>🔑</span> Flash ID</li>
        <li className="flex items-center gap-2"><span>👤</span> Name</li>
        <li className="flex items-center gap-2"><span>📧</span> Email</li>
        <li className="flex items-center gap-2"><span>📱</span> Phone number</li>
      </ul>

      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-900 flex gap-2 items-start">
        <Lock className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
        <span>
          <span className="font-semibold">Stays on your phone:</span> your fingerprint, face, and voice data — always.
        </span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Used to verify your identity when you sign in. You can disconnect this site anytime from the Flash ID app.
      </p>

      <div className="flex items-center justify-center gap-2 text-sm text-blue-600 font-medium pt-1">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Review and approve on your phone to continue.</span>
      </div>
    </div>
  );
}
