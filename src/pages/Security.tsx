import { useState } from 'react';
import { ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { mockBannedIPs, type BannedIP } from '../lib/api';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function Security() {
  // Rate limiting
  const [globalRateLimit, setGlobalRateLimit] = useState(30);
  const callbackLimit = Math.round(globalRateLimit / 3);

  // Auto-ban policy
  const [banThreshold, setBanThreshold] = useState(5);
  const [banDuration, setBanDuration] = useState(60);
  const [banAction, setBanAction] = useState<'block' | 'throttle'>('block');

  // Banned IPs
  const [bannedIPs, setBannedIPs] = useState<BannedIP[]>(mockBannedIPs);
  const [showBanForm, setShowBanForm] = useState(false);
  const [newBanIP, setNewBanIP] = useState('');
  const [newBanReason, setNewBanReason] = useState('');
  const [newBanTenant, setNewBanTenant] = useState('Global');
  const [newBanPermanent, setNewBanPermanent] = useState(false);

  // Geo settings
  const [geoEnabled, setGeoEnabled] = useState(true);
  const [geoCacheDuration, setGeoCacheDuration] = useState(24);

  // Save feedback
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUnban = (ip: string) => {
    setBannedIPs((prev) => prev.filter((b) => b.ip !== ip));
  };

  const handleAddBan = () => {
    if (!newBanIP.trim()) return;
    const newBan: BannedIP = {
      ip: newBanIP.trim(),
      reason: newBanReason || 'Manually banned by admin',
      tenantId: 'global',
      tenantName: newBanTenant,
      bannedAt: new Date().toISOString(),
      expiresAt: newBanPermanent ? null : new Date(Date.now() + banDuration * 60000).toISOString(),
    };
    setBannedIPs((prev) => [newBan, ...prev]);
    setNewBanIP('');
    setNewBanReason('');
    setNewBanTenant('Global');
    setNewBanPermanent(false);
    setShowBanForm(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Security</h1>
          <p className="text-sm text-slate-500 mt-1">Manage rate limiting, bans, and geo settings</p>
        </div>
        <ShieldAlert className="h-6 w-6 text-red-500" />
      </div>

      {/* Rate Limiting */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Rate Limiting</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Global Rate Limit <span className="text-slate-400 font-normal">(req/min per IP)</span>
            </label>
            <input
              type="number"
              min={5}
              max={200}
              value={globalRateLimit}
              onChange={(e) => setGlobalRateLimit(Math.min(200, Math.max(5, Number(e.target.value))))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">Range: 5 - 200</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Callback Endpoint Limit <span className="text-slate-400 font-normal">(calculated)</span>
            </label>
            <div className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
              {callbackLimit} req/min per IP
            </div>
            <p className="text-xs text-slate-400 mt-1">Callback gets 1/3 of global limit</p>
          </div>
        </div>
      </section>

      {/* Auto-Ban Policy */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Auto-Ban Policy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ban Threshold <span className="text-slate-400 font-normal">(failed attempts)</span>
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={banThreshold}
              onChange={(e) => setBanThreshold(Math.min(100, Math.max(1, Number(e.target.value))))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">Range: 1 - 100</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ban Duration <span className="text-slate-400 font-normal">(minutes)</span>
            </label>
            <input
              type="number"
              min={1}
              max={10080}
              value={banDuration}
              onChange={(e) => setBanDuration(Math.min(10080, Math.max(1, Number(e.target.value))))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">Range: 1 - 10,080 (7 days)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ban Action</label>
            <select
              value={banAction}
              onChange={(e) => setBanAction(e.target.value as 'block' | 'throttle')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
            >
              <option value="block">Block (429 response)</option>
              <option value="throttle">Throttle</option>
            </select>
          </div>
        </div>
      </section>

      {/* Active IP Bans */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Active IP Bans</h2>
            <p className="text-xs text-slate-500 mt-0.5">{bannedIPs.length} banned IPs</p>
          </div>
          <button
            onClick={() => setShowBanForm(!showBanForm)}
            className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ban IP
          </button>
        </div>

        {showBanForm && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">IP Address</label>
                <input
                  type="text"
                  value={newBanIP}
                  onChange={(e) => setNewBanIP(e.target.value)}
                  placeholder="e.g. 192.168.1.1"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={newBanReason}
                  onChange={(e) => setNewBanReason(e.target.value)}
                  placeholder="Reason for ban"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tenant</label>
                <input
                  type="text"
                  value={newBanTenant}
                  onChange={(e) => setNewBanTenant(e.target.value)}
                  placeholder="Global or tenant name"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={newBanPermanent}
                    onChange={(e) => setNewBanPermanent(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  Permanent
                </label>
                <button
                  onClick={handleAddBan}
                  className="ml-auto bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">IP Address</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Reason</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tenant</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Banned At</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Expires</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bannedIPs.map((ban) => (
                <tr key={ban.ip} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-slate-700">{ban.ip}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">{ban.reason}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{ban.tenantName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(ban.bannedAt)}</td>
                  <td className="px-4 py-3">
                    {ban.expiresAt ? (
                      <span className="text-xs text-slate-500">{formatDateTime(ban.expiresAt)}</span>
                    ) : (
                      <span className="text-xs font-medium text-red-600">Permanent</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleUnban(ban.ip)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Unban
                    </button>
                  </td>
                </tr>
              ))}
              {bannedIPs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    No active IP bans
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Geo-Location Settings */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Geo-Location Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Enable Geo-Tracking</label>
            <button
              onClick={() => setGeoEnabled(!geoEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                geoEnabled ? 'bg-red-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  geoEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
            <div className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
              ip-api.com
            </div>
            <p className="text-xs text-slate-400 mt-1">Read-only</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cache Duration <span className="text-slate-400 font-normal">(hours)</span>
            </label>
            <input
              type="number"
              min={1}
              max={168}
              value={geoCacheDuration}
              onChange={(e) => setGeoCacheDuration(Math.min(168, Math.max(1, Number(e.target.value))))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          {saved ? 'Saved!' : 'Save Security Settings'}
        </button>
      </div>
    </div>
  );
}
