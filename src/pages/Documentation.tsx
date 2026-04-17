import { BookOpen, Fingerprint, Building2, ShieldAlert, ScrollText, Settings, Zap, Globe, Key, Users } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="space-y-8">
      {/* Getting Started */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">Getting Started</h2>
        </div>
        <p className="text-sm text-slate-600 mb-3">
          The Super Admin portal provides full oversight of the Flash ID platform. From here you can manage tenants, monitor authentication events, configure security policies, and review billing.
        </p>
        <p className="text-sm text-slate-600">
          Use the sidebar navigation to switch between sections. The global filter in the top bar lets you scope data by integration type (<span className="font-medium">All</span>, <span className="font-medium">WP</span> for WordPress, or <span className="font-medium">API</span> for direct integrations).
        </p>
      </section>

      {/* Portal Sections */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Portal Sections</h2>
        <div className="space-y-4">
          {[
            { icon: Fingerprint, color: 'text-red-500', bg: 'bg-red-50', title: 'Dashboard', desc: 'Platform overview with real-time stats — active tenants, total authentications, success rates, and system health indicators.' },
            { icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50', title: 'Tenants', desc: 'Add, view, edit, suspend, or delete tenant accounts. Each tenant represents a business that has integrated Flash ID into their login flow.' },
            { icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-50', title: 'Security', desc: 'Configure rate limiting thresholds, manage IP bans, and set geo-restriction policies. Visible for API integrations only.' },
            { icon: ScrollText, color: 'text-green-500', bg: 'bg-green-50', title: 'Events', desc: 'Full audit trail of platform activity — authentication attempts, tenant changes, security alerts. Filter by type, status, or date range. Export as CSV.' },
            { icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50', title: 'Billing', desc: 'Revenue summary, usage breakdown by tenant, invoice history, and payment status tracking.' },
            { icon: Settings, color: 'text-slate-500', bg: 'bg-slate-100', title: 'Settings', desc: 'Profile info, theme preferences, session timeout, and biometric management — configure which verification methods are required for login.' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${item.bg} mt-0.5`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Biometric Verification */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Fingerprint className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold text-slate-900">Biometric Verification</h2>
        </div>
        <p className="text-sm text-slate-600 mb-3">
          Flash ID supports three biometric methods that can be toggled independently in Settings:
        </p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><span className="font-medium text-slate-900">Face Recognition</span> — device camera captures and verifies the user's face against their enrolled biometric template.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
            <span><span className="font-medium text-slate-900">Fingerprint</span> — uses the device's built-in fingerprint sensor for verification.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
            <span><span className="font-medium text-slate-900">Voice Print</span> — captures a voice sample and compares it against the enrolled voiceprint using AI embeddings.</span>
          </li>
        </ul>
        <p className="text-xs text-slate-400 mt-3">
          If no specific method is required, the app will accept any enrolled biometric method.
        </p>
      </section>

      {/* Tenant Lifecycle */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-slate-900">Tenant Lifecycle</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-600">
          <p><span className="font-medium text-slate-900">Adding a tenant:</span> Click "Add Tenant" on the Tenants page. Provide a name, domain, contact email, and select the integration type (WordPress plugin or API).</p>
          <p><span className="font-medium text-slate-900">API keys:</span> Each tenant receives a unique API key and signing secret. These are used to authenticate requests between their site and the Flash ID platform.</p>
          <p><span className="font-medium text-slate-900">Suspending a tenant:</span> Suspending temporarily disables all authentication for that tenant without deleting their data. Reactivate at any time.</p>
          <p><span className="font-medium text-slate-900">Deleting a tenant:</span> Permanently removes the tenant and all associated data. This action cannot be undone.</p>
        </div>
      </section>

      {/* Security & Access */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">Security & Access</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-600">
          <p><span className="font-medium text-slate-900">Authentication:</span> Super Admin access requires Google SSO with a whitelisted email address. QR verification is required on first login per device.</p>
          <p><span className="font-medium text-slate-900">Session timeout:</span> Configurable in Settings. After the timeout period, you will be automatically signed out for security.</p>
          <p><span className="font-medium text-slate-900">Rate limiting:</span> Set per-IP request thresholds in the Security section to protect against brute-force attacks. Banned IPs are automatically blocked.</p>
          <p><span className="font-medium text-slate-900">Audit trail:</span> All actions are logged in the Events section with timestamps, IP addresses, and details for full accountability.</p>
        </div>
      </section>
    </div>
  );
}
