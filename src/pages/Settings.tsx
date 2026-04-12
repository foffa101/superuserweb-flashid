import { useState, useEffect } from 'react';
import { ScanFace, Fingerprint, Mic, ToggleLeft, ToggleRight, Settings as SettingsIcon, Shield, ShieldCheck, ShieldAlert, Hash, ListChecks, Smile, Grid3X3, Type, Palette, Shapes, Flag, Hand, Smartphone, PenTool, Volume2, Shuffle } from 'lucide-react';
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
  const [securityLevel, setSecurityLevel] = useState(() => {
    return localStorage.getItem('superadmin-security-level') || 'secure';
  });
  const [pollInterval, setPollInterval] = useState(() => {
    return localStorage.getItem('superadmin-poll-interval') || '1500';
  });

  // Biometric requirements
  const [requireFace, setRequireFace] = useState(() => localStorage.getItem('superadmin-require-face') === '1');
  const [requireFingerprint, setRequireFingerprint] = useState(() => localStorage.getItem('superadmin-require-fingerprint') === '1');
  const [requireVoice, setRequireVoice] = useState(() => localStorage.getItem('superadmin-require-voice') === '1');

  // Verification methods
  const [enabledMethods, setEnabledMethods] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('superadmin-verification-methods') || '{}');
    } catch { return {}; }
  });

  const toggleMethod = (method: string) => {
    setEnabledMethods(prev => ({ ...prev, [method]: !prev[method] }));
  };

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
    localStorage.setItem('superadmin-security-level', securityLevel);
    localStorage.setItem('superadmin-poll-interval', pollInterval);
    localStorage.setItem('superadmin-require-face', requireFace ? '1' : '0');
    localStorage.setItem('superadmin-require-fingerprint', requireFingerprint ? '1' : '0');
    localStorage.setItem('superadmin-require-voice', requireVoice ? '1' : '0');
    localStorage.setItem('superadmin-verification-methods', JSON.stringify(enabledMethods));
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
        <div className="mt-6 pt-6 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Verification Persistence
          </label>
          <div className="space-y-2">
            {[
              { value: 'secure', icon: Shield, label: 'Secure', desc: 'Verification persists across page refreshes, clears when browser tab closes', color: 'text-green-500' },
              { value: 'more-secure', icon: ShieldCheck, label: 'More Secure', desc: 'Verification persists for the session timeout duration, then re-verifies', color: 'text-amber-500' },
              { value: 'most-secure', icon: ShieldAlert, label: 'Most Secure', desc: 'Verification required on every page load', color: 'text-red-500' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  securityLevel === opt.value
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="securityLevel"
                  value={opt.value}
                  checked={securityLevel === opt.value}
                  onChange={(e) => setSecurityLevel(e.target.value)}
                  className="mt-1 accent-red-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <opt.icon className={`h-4 w-4 ${opt.color}`} />
                    <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                    {opt.value === 'secure' && (
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
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

      {/* Verification Methods */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Verification Methods</h2>
        <div className="divide-y divide-slate-100">
          {([
            { key: 'type_code', icon: Hash, label: 'Type Code', desc: 'User types a 6-digit code shown on the site', color: 'text-blue-500', bg: 'bg-blue-50', category: 'OTP' },
            { key: 'select_code', icon: ListChecks, label: 'Select Code', desc: 'User selects the correct code from multiple choices', color: 'text-blue-500', bg: 'bg-blue-50', category: 'OTP' },
            { key: 'emoji_match', icon: Smile, label: 'Emoji Match', desc: 'Find 3 target emojis in a 3x3 grid', color: 'text-amber-500', bg: 'bg-amber-50', category: 'Visual' },
            { key: 'number_sequence', icon: Grid3X3, label: 'Number Sequence', desc: 'Tap numbers in the correct order', color: 'text-amber-500', bg: 'bg-amber-50', category: 'Visual' },
            { key: 'word_match', icon: Type, label: 'Word Match', desc: 'Find 3 target words in a 3x3 grid', color: 'text-amber-500', bg: 'bg-amber-50', category: 'Visual' },
            { key: 'icon_match', icon: Grid3X3, label: 'Icon Match', desc: 'Find 3 target icons in a 3x3 grid', color: 'text-amber-500', bg: 'bg-amber-50', category: 'Visual' },
            { key: 'color_match', icon: Palette, label: 'Color Match', desc: 'Find 3 target colors in a 3x3 grid', color: 'text-amber-500', bg: 'bg-amber-50', category: 'Visual' },
            { key: 'shape_match', icon: Shapes, label: 'Shape Match', desc: 'Find 3 target shapes in a 3x3 grid', color: 'text-amber-500', bg: 'bg-amber-50', category: 'Visual' },
            { key: 'flag_match', icon: Flag, label: 'Flag Match', desc: 'Find 3 target flags in a 3x3 grid', color: 'text-amber-500', bg: 'bg-amber-50', category: 'Visual' },
            { key: 'tap_pattern', icon: Hand, label: 'Tap Pattern', desc: 'Watch a pattern and reproduce it on a grid', color: 'text-indigo-500', bg: 'bg-indigo-50', category: 'Gesture' },
            { key: 'shake_verify', icon: Smartphone, label: 'Shake to Verify', desc: 'Shake the phone to confirm identity', color: 'text-indigo-500', bg: 'bg-indigo-50', category: 'Gesture' },
            { key: 'draw_match', icon: PenTool, label: 'Draw Match', desc: 'Draw a shape shown on screen', color: 'text-indigo-500', bg: 'bg-indigo-50', category: 'Gesture' },
            { key: 'voice_phrase', icon: Mic, label: 'Voice Phrase', desc: 'Read a phrase aloud for speech recognition', color: 'text-pink-500', bg: 'bg-pink-50', category: 'Audio' },
            { key: 'animal_sound', icon: Volume2, label: 'Animal Sound', desc: 'Listen to a sound and identify the animal', color: 'text-pink-500', bg: 'bg-pink-50', category: 'Audio' },
            { key: 'random', icon: Shuffle, label: 'Random', desc: 'Randomly pick a different method each login', color: 'text-slate-500', bg: 'bg-slate-100', category: 'Other' },
          ] as const).map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
              <button type="button" onClick={() => toggleMethod(item.key)}>
                {enabledMethods[item.key] ? (
                  <ToggleRight className="h-8 w-8 text-red-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-slate-300" />
                )}
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Enable one or more methods. If multiple are enabled, one is randomly chosen each login. If none are enabled, only biometric verification is used.
        </p>
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
