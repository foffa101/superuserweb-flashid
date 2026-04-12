import { useState, useEffect } from 'react';
import { ScanFace, Fingerprint, Mic, ToggleLeft, ToggleRight, Settings as SettingsIcon } from 'lucide-react';
import { type User } from '../lib/firebase';

interface SettingsProps {
  user: User;
}

type Theme = 'light' | 'dark';

const SESSION_TIMEOUT_OPTIONS = [
  { label: '5 minutes', value: '5m' },
  { label: '15 minutes', value: '15m' },
  { label: '30 minutes', value: '30m' },
  { label: '1 hour', value: '1h' },
  { label: '2 hours', value: '2h' },
  { label: '4 hours', value: '4h' },
  { label: '8 hours', value: '8h' },
  { label: '12 hours', value: '12h' },
  { label: '18 hours', value: '18h' },
  { label: '24 hours', value: '24h' },
  { label: 'Keep logged in', value: 'never' },
];

export default function Settings({ user }: SettingsProps) {
  // Portal settings
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('superadmin-theme') as Theme) || 'light';
  });
  const [sessionTimeout, setSessionTimeout] = useState(() => {
    return localStorage.getItem('superadmin-session-timeout') || '4h';
  });
  const [pollInterval, setPollInterval] = useState(() => {
    return localStorage.getItem('superadmin-poll-interval') || '1500';
  });

  // Biometric requirements
  const [requireFace, setRequireFace] = useState(() => localStorage.getItem('superadmin-require-face') === '1');
  const [requireFingerprint, setRequireFingerprint] = useState(() => localStorage.getItem('superadmin-require-fingerprint') === '1');
  const [requireVoice, setRequireVoice] = useState(() => localStorage.getItem('superadmin-require-voice') === '1');

  // Save feedback
  const [saved, setSaved] = useState(false);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSave = () => {
    localStorage.setItem('superadmin-theme', theme);
    localStorage.setItem('superadmin-session-timeout', sessionTimeout);
    localStorage.setItem('superadmin-poll-interval', pollInterval);
    localStorage.setItem('superadmin-require-face', requireFace ? '1' : '0');
    localStorage.setItem('superadmin-require-fingerprint', requireFingerprint ? '1' : '0');
    localStorage.setItem('superadmin-require-voice', requireVoice ? '1' : '0');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-xl">
          <SettingsIcon className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Profile and portal preferences</p>
        </div>
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

      {/* Theme Settings */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Theme Settings</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
          <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
            <button
              onClick={() => setTheme('light')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-slate-300 ${
                theme === 'dark'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Dark
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Theme preference is stored locally</p>
        </div>
      </section>

      {/* Session Timeout */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Session Timeout</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Timeout <span className="text-slate-400 font-normal">(auto-logout)</span>
          </label>
          <select
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            className="w-full max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          >
            {SESSION_TIMEOUT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">How long before you are automatically logged out from this portal</p>
        </div>
      </section>

      {/* Biometric Management */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Biometric Management</h2>
        <div className="divide-y divide-slate-100">
          {[
            { icon: ScanFace, label: 'Face Recognition', desc: 'Require face verification for login', color: 'text-blue-500', bg: 'bg-blue-50', value: requireFace, set: setRequireFace },
            { icon: Fingerprint, label: 'Fingerprint', desc: 'Require fingerprint verification for login', color: 'text-green-500', bg: 'bg-green-50', value: requireFingerprint, set: setRequireFingerprint },
            { icon: Mic, label: 'Voice Print', desc: 'Require voice verification for login', color: 'text-purple-500', bg: 'bg-purple-50', value: requireVoice, set: setRequireVoice },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
              <button type="button" onClick={() => item.set(!item.value)}>
                {item.value ? (
                  <ToggleRight className="h-8 w-8 text-red-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-slate-300" />
                )}
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          If none selected, the app will use any enrolled method.
        </p>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Poll Interval (milliseconds)
          </label>
          <input
            type="number"
            min="1000"
            max="5000"
            step="100"
            value={pollInterval}
            onChange={(e) => setPollInterval(e.target.value)}
            className="w-full max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            How frequently the browser checks for the verification approval status from Flash ID app (1000-5000ms).
          </p>
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
