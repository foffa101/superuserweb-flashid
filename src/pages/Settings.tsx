import { useState } from 'react';
import { type User } from '../lib/firebase';

interface SettingsProps {
  user: User;
}

export default function Settings({ user }: SettingsProps) {
  // Platform defaults
  const [defaultSessionTimeout, setDefaultSessionTimeout] = useState(90);
  const [maxSessionTimeout, setMaxSessionTimeout] = useState(300);
  const [minPollInterval, setMinPollInterval] = useState(500);
  const [defaultUserPolicy, setDefaultUserPolicy] = useState<'allow' | 'reject'>('allow');

  // Signing secret
  const [rotationDays, setRotationDays] = useState(90);
  const lastRotated = '2026-03-15T10:00:00Z';

  // Save feedback
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Global configuration for the FlashID platform</p>
      </div>

      {/* Profile */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-4">
          {user.photoURL && (
            <img src={user.photoURL} alt="" className="h-16 w-16 rounded-full border-2 border-slate-200" />
          )}
          <div>
            <p className="text-sm font-medium text-slate-900">{user.displayName || 'Admin User'}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">Profile info is managed via Google SSO and is read-only here.</p>
      </section>

      {/* Platform Defaults */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Platform Defaults</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default Session Timeout <span className="text-slate-400 font-normal">(seconds)</span>
            </label>
            <input
              type="number"
              min={10}
              max={300}
              value={defaultSessionTimeout}
              onChange={(e) => setDefaultSessionTimeout(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">Applied to new sites by default</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Max Session Timeout Allowed <span className="text-slate-400 font-normal">(seconds)</span>
            </label>
            <input
              type="number"
              min={30}
              max={600}
              value={maxSessionTimeout}
              onChange={(e) => setMaxSessionTimeout(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">Tenants cannot set timeout higher than this</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Min Poll Interval Allowed <span className="text-slate-400 font-normal">(ms)</span>
            </label>
            <input
              type="number"
              min={100}
              max={5000}
              step={100}
              value={minPollInterval}
              onChange={(e) => setMinPollInterval(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">Prevents clients from polling too aggressively</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default User Policy for New Sites
            </label>
            <select
              value={defaultUserPolicy}
              onChange={(e) => setDefaultUserPolicy(e.target.value as 'allow' | 'reject')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            >
              <option value="allow">Allow (users verified by default)</option>
              <option value="reject">Reject (users must be approved)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Signing Secret Rotation */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Signing Secret Rotation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rotation Interval <span className="text-slate-400 font-normal">(days)</span>
            </label>
            <input
              type="number"
              min={7}
              max={365}
              value={rotationDays}
              onChange={(e) => setRotationDays(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Rotated</label>
            <div className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
              {new Date(lastRotated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Next rotation due: {new Date(new Date(lastRotated).getTime() + rotationDays * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* API Version Info */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">API Version Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase mb-1">Current API Version</p>
            <p className="text-sm font-semibold text-slate-900">v1.2.0</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase mb-1">Min Supported Version</p>
            <p className="text-sm font-semibold text-slate-900">v1.0.0</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase mb-1">WP Plugin Version</p>
            <p className="text-sm font-semibold text-slate-900">1.0.4</p>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
