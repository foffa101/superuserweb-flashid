import { useState, useEffect, useCallback } from 'react';
import { ScanFace, Fingerprint, Mic, ToggleLeft, ToggleRight, Settings as SettingsIcon, Shield, ShieldCheck, ShieldAlert, Hash, ListChecks, Smile, Grid3X3, Type, Palette, Shapes, Flag, Hand, Smartphone, PenTool, Volume2, Shuffle, Ban, Dice5, QrCode, Timer, Eye, UserPlus, X, Users, Mail, Save, CheckCircle } from 'lucide-react';
import { type User } from '../lib/firebase';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { app } from '../lib/firebase';
import { FieldAgentIcon } from '../components/FieldAgentIcon';

const db = getFirestore(app, 'ai-studio-5104b9c1-7e74-4c52-9bdf-6e57ed9d5d3c');

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

const QR_TIMEOUT_OPTIONS = [
  { label: '30 seconds', value: '30' },
  { label: '60 seconds', value: '60' },
  { label: '90 seconds', value: '90' },
  { label: '120 seconds', value: '120' },
  { label: '180 seconds', value: '180' },
  { label: '300 seconds (5 min)', value: '300' },
];

// Challenge method definitions with icons
const CHALLENGE_METHODS = {
  otp: [
    { key: 'type_code', icon: Hash, label: 'Type Code (6-digit)', desc: 'App displays code — user types it into site input box', color: 'text-blue-500', bg: 'bg-blue-50' },
    { key: 'select_code', icon: ListChecks, label: 'Select Code (multiple choice)', desc: 'Site shows 1 code — user selects matching one from 4 choices on app', color: 'text-blue-500', bg: 'bg-blue-50' },
  ],
  visual: [
    { key: 'emoji_match', icon: Smile, label: 'Emoji Match', desc: 'Site shows 1 emoji — user selects matching one from 4 choices on app', color: 'text-amber-500', bg: 'bg-amber-50' },
    { key: 'color_match', icon: Palette, label: 'Color Match', desc: 'Site shows 1 color — user selects matching one from 4 choices on app', color: 'text-amber-500', bg: 'bg-amber-50' },
    { key: 'shape_match', icon: Shapes, label: 'Shape Match', desc: 'Site shows 1 shape — user selects matching one from 4 choices on app', color: 'text-amber-500', bg: 'bg-amber-50' },
    { key: 'icon_match', icon: Grid3X3, label: 'Icon Match', desc: 'Site shows 1 icon — user selects matching one from 4 choices on app', color: 'text-amber-500', bg: 'bg-amber-50' },
    { key: 'flag_match', icon: Flag, label: 'Flag Match', desc: 'Site shows 1 flag — user selects matching one from 4 choices on app', color: 'text-amber-500', bg: 'bg-amber-50' },
    { key: 'word_match', icon: Type, label: 'Word Match', desc: 'Site shows 1 word — user selects matching one from 4 choices on app', color: 'text-amber-500', bg: 'bg-amber-50' },
    { key: 'number_sequence', icon: Grid3X3, label: 'Number Sequence', desc: 'User watches numbers light up on app and taps them in order', color: 'text-amber-500', bg: 'bg-amber-50' },
  ],
  gesture: [
    { key: 'tap_pattern', icon: Hand, label: 'Tap Pattern', desc: 'User watches pattern on app and reproduces it by tapping same cells', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { key: 'shake_verify', icon: Smartphone, label: 'Shake to Verify', desc: 'App detects shake motion and confirms identity', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { key: 'draw_match', icon: PenTool, label: 'Draw Match', desc: 'Site displays a shape — user draws it on the app canvas', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ],
  audio: [
    { key: 'voice_phrase', icon: Mic, label: 'Voice Phrase', desc: 'User reads a phrase aloud — app captures and verifies voice', color: 'text-pink-500', bg: 'bg-pink-50' },
    { key: 'animal_sound', icon: Volume2, label: 'Animal Sound', desc: 'Sound plays on site — user selects matching animal on app', color: 'text-pink-500', bg: 'bg-pink-50' },
  ],
};

export default function Settings({ user }: SettingsProps) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('superadmin-theme') as Theme) || 'light');
  const [sessionTimeout, setSessionTimeout] = useState(() => localStorage.getItem('superadmin-session-timeout') || '4h');
  const [securityLevel, setSecurityLevel] = useState(() => localStorage.getItem('superadmin-security-level') || 'secure');
  const [qrTimeout, setQrTimeout] = useState(() => localStorage.getItem('superadmin-qr-timeout') || '90');
  const [pollInterval, setPollInterval] = useState(() => localStorage.getItem('superadmin-poll-interval') || '1500');

  // Biometric requirements
  const [requireFace, setRequireFace] = useState(() => localStorage.getItem('superadmin-require-face') === '1');
  const [requireFingerprint, setRequireFingerprint] = useState(() => localStorage.getItem('superadmin-require-fingerprint') === '1');
  const [requireVoice, setRequireVoice] = useState(() => localStorage.getItem('superadmin-require-voice') === '1');
  // Default on first use: None selected. Invariant enforced below ensures
  // that the Biometric Verification section is never left all-off.
  const [biometricNone, setBiometricNone] = useState(() => {
    const stored = localStorage.getItem('superadmin-biometric-none');
    return stored === null ? true : stored === '1';
  });
  const [biometricRandom, setBiometricRandom] = useState(() => localStorage.getItem('superadmin-biometric-random') === '1');

  // Invariant: the biometric section can never be all-off. If corrupted
  // localStorage leaves every toggle false, fall back to None on mount.
  useEffect(() => {
    if (!requireFace && !requireFingerprint && !requireVoice && !biometricNone && !biometricRandom) {
      setBiometricNone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBiometricNone = (on: boolean) => {
    setBiometricNone(on);
    if (on) { setRequireFace(false); setRequireFingerprint(false); setRequireVoice(false); setBiometricRandom(false); }
    else { setBiometricRandom(true); }
  };
  const handleBiometricRandom = (on: boolean) => {
    setBiometricRandom(on);
    if (on) { setBiometricNone(false); }
    else if (!requireFace && !requireFingerprint && !requireVoice) { setBiometricNone(true); }
  };
  const handleBiometricToggle = (setter: (v: boolean) => void, value: boolean) => {
    setter(!value);
    if (!value) { setBiometricNone(false); }
    else {
      // Turning off — check if all will be off
      const nextFace = setter === setRequireFace ? false : requireFace;
      const nextFinger = setter === setRequireFingerprint ? false : requireFingerprint;
      const nextVoice = setter === setRequireVoice ? false : requireVoice;
      if (!nextFace && !nextFinger && !nextVoice && !biometricRandom) { setBiometricNone(true); }
    }
  };

  // Access management — whitelist
  const [whitelistEmails, setWhitelistEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [whitelistLoading, setWhitelistLoading] = useState(true);
  const [whitelistSaving, setWhitelistSaving] = useState(false);

  const loadWhitelist = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'superadmin_config', 'whitelist'));
      if (snap.exists()) {
        setWhitelistEmails(snap.data().emails || []);
      } else {
        // Seed from defaults
        const defaults = ['okafifi@gmail.com', 'webauthor@gmail.com', 'omar@afifi.com'];
        setWhitelistEmails(defaults);
        await setDoc(doc(db, 'superadmin_config', 'whitelist'), { emails: defaults });
      }
    } catch {
      setWhitelistEmails(['okafifi@gmail.com', 'webauthor@gmail.com', 'omar@afifi.com']);
    } finally {
      setWhitelistLoading(false);
    }
  }, []);

  useEffect(() => { loadWhitelist(); }, [loadWhitelist]);

  const saveWhitelist = async (emails: string[]) => {
    setWhitelistSaving(true);
    try {
      await setDoc(doc(db, 'superadmin_config', 'whitelist'), { emails });
      setWhitelistEmails(emails);
    } catch (e) {
      console.error('Failed to save whitelist:', e);
    } finally {
      setWhitelistSaving(false);
    }
  };

  // Push approval flow
  const [pendingApproval, setPendingApproval] = useState<string | null>(null); // approval doc ID
  const [approvalStatus, setApprovalStatus] = useState<'idle' | 'waiting' | 'approved' | 'denied'>('idle');

  const addEmail = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@') || whitelistEmails.includes(email)) return;

    // Create approval request in Firestore
    const approvalId = `approval_${Date.now()}`;
    const approvalData = {
      type: 'add_admin',
      email,
      requestedBy: user.email,
      requestedByUid: user.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 120 * 1000).toISOString(),
    };

    try {
      await setDoc(doc(db, 'admin_approvals', approvalId), approvalData);
      setPendingApproval(approvalId);
      setApprovalStatus('waiting');
    } catch (e) {
      console.error('Failed to create approval:', e);
    }
  };

  // Listen for approval status changes
  useEffect(() => {
    if (!pendingApproval) return;
    const unsub = onSnapshot(doc(db, 'admin_approvals', pendingApproval), (snap) => {
      const data = snap.data();
      if (!data) return;
      if (data.status === 'approved') {
        setApprovalStatus('approved');
        // Add the email to whitelist
        const email = data.email;
        if (email && !whitelistEmails.includes(email)) {
          saveWhitelist([...whitelistEmails, email]);
        }
        setNewEmail('');
        // Cleanup
        deleteDoc(doc(db, 'admin_approvals', pendingApproval));
        setTimeout(() => {
          setPendingApproval(null);
          setApprovalStatus('idle');
        }, 2000);
      } else if (data.status === 'denied') {
        setApprovalStatus('denied');
        deleteDoc(doc(db, 'admin_approvals', pendingApproval));
        setTimeout(() => {
          setPendingApproval(null);
          setApprovalStatus('idle');
        }, 2000);
      }
    });
    // Timeout after 2 minutes
    const timeout = setTimeout(() => {
      if (approvalStatus === 'waiting') {
        setApprovalStatus('idle');
        setPendingApproval(null);
        deleteDoc(doc(db, 'admin_approvals', pendingApproval));
      }
    }, 120000);
    return () => { unsub(); clearTimeout(timeout); };
  }, [pendingApproval]);

  const removeEmail = (email: string) => {
    // Don't allow removing yourself
    if (email.toLowerCase() === user.email?.toLowerCase()) return;
    saveWhitelist(whitelistEmails.filter(e => e !== email));
  };

  // Challenge methods (single-select).
  // Default to type_code (6-digit OTP) for fresh / cleared browsers — voice_phrase
  // is not stable enough yet for first-time users to land on it.
  const [enabledMethods, setEnabledMethods] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('superadmin-verification-methods');
      if (raw) return JSON.parse(raw);
    } catch { /* fall through */ }
    return { type_code: true };
  });
  const selectMethod = (key: string) => setEnabledMethods({ [key]: true });
  const clearMethod = () => setEnabledMethods({});
  const toggleChallengeNone = () => {
    const isNone = !Object.values(enabledMethods).some(v => v);
    if (isNone) { setEnabledMethods({ random: true }); }
    else { setEnabledMethods({}); }
  };

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleSave = () => {
    localStorage.setItem('superadmin-theme', theme);
    localStorage.setItem('superadmin-session-timeout', sessionTimeout);
    localStorage.setItem('superadmin-security-level', securityLevel);
    localStorage.setItem('superadmin-qr-timeout', qrTimeout);
    localStorage.setItem('superadmin-poll-interval', pollInterval);
    localStorage.setItem('superadmin-require-face', requireFace ? '1' : '0');
    localStorage.setItem('superadmin-require-fingerprint', requireFingerprint ? '1' : '0');
    localStorage.setItem('superadmin-require-voice', requireVoice ? '1' : '0');
    localStorage.setItem('superadmin-biometric-none', biometricNone ? '1' : '0');
    localStorage.setItem('superadmin-biometric-random', biometricRandom ? '1' : '0');
    localStorage.setItem('superadmin-verification-methods', JSON.stringify(enabledMethods));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ChallengeRadio = ({ item, accent }: { item: typeof CHALLENGE_METHODS.otp[0]; accent: string }) => (
    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${enabledMethods[item.key] ? `border-${accent}-300 bg-${accent}-50` : 'border-slate-200 hover:bg-slate-50'}`}>
      <input type="radio" name="challengeMethod" checked={!!enabledMethods[item.key]} onChange={() => selectMethod(item.key)} className={`accent-${accent}-600`} />
      <div className={`p-1.5 rounded-lg ${item.bg}`}>
        <item.icon className={`h-4 w-4 ${item.color}`} />
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium text-slate-900">{item.label}</span>
        <p className="text-xs text-slate-400">{item.desc}</p>
      </div>
    </label>
  );

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
          {user.photoURL && <img src={user.photoURL} alt="" className="h-16 w-16 rounded-full border-2 border-slate-200" />}
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
            <button onClick={() => setTheme('light')} className={`px-4 py-2 text-sm font-medium transition-colors ${theme === 'light' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>Light</button>
            <button onClick={() => setTheme('dark')} className={`px-4 py-2 text-sm font-medium transition-colors border-l border-slate-300 ${theme === 'dark' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>Dark</button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Theme preference is stored locally</p>
        </div>
      </section>

      {/* Session Timeout */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Session Timeout</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Timeout <span className="text-slate-400 font-normal">(auto-logout)</span></label>
          <select value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="w-full max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
            {SESSION_TIMEOUT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <p className="text-xs text-slate-400 mt-1">How long before you are automatically logged out from this portal</p>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-3">Verification Persistence</label>
          <div className="space-y-2">
            {[
              { value: 'secure', icon: Shield, label: 'Secure', desc: 'Verification persists across page refreshes, clears when browser tab closes', color: 'text-green-500' },
              { value: 'more-secure', icon: ShieldCheck, label: 'More Secure', desc: 'Verification persists for the session timeout duration, then re-verifies', color: 'text-amber-500' },
              { value: 'most-secure', icon: ShieldAlert, label: 'Most Secure', desc: 'Verification required on every page load', color: 'text-red-500' },
            ].map((opt) => (
              <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${securityLevel === opt.value ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="securityLevel" value={opt.value} checked={securityLevel === opt.value} onChange={(e) => setSecurityLevel(e.target.value)} className="mt-1 accent-red-600" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <opt.icon className={`h-4 w-4 ${opt.color}`} />
                    <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                    {opt.value === 'secure' && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase">Default</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* QR Code Settings */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">QR Code Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <span className="flex items-center gap-2"><QrCode className="h-4 w-4 text-slate-400" /> QR Code Timeout</span>
            </label>
            <select value={qrTimeout} onChange={(e) => setQrTimeout(e.target.value)} className="w-full max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
              {QR_TIMEOUT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">How long the QR code stays valid before expiring</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <span className="flex items-center gap-2"><Timer className="h-4 w-4 text-slate-400" /> Poll Interval (milliseconds)</span>
            </label>
            <input type="number" min="1000" max="5000" step="100" value={pollInterval} onChange={(e) => setPollInterval(e.target.value)} className="w-full max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" />
            <p className="text-xs text-slate-400 mt-1">How frequently the browser checks for the verification approval status from Flash ID app (1000-5000ms)</p>
          </div>
        </div>
      </section>

      {/* Biometric Verification */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Biometric Verification</h2>
        <div className="divide-y divide-slate-100">
          {/* None — always visible at top */}
          <div className="flex items-center justify-between py-3 first:pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100"><Ban className="h-5 w-5 text-slate-400" /></div>
              <div>
                <p className="text-sm font-medium text-slate-900">None</p>
                <p className="text-xs text-slate-400">Skip biometric verification — challenge only</p>
              </div>
            </div>
            <button type="button" onClick={() => handleBiometricNone(!biometricNone)}>
              {biometricNone ? <ToggleRight className="h-8 w-8 text-red-600" /> : <ToggleLeft className="h-8 w-8 text-slate-300" />}
            </button>
          </div>

          {/* Other biometric options — collapse when None is active */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${biometricNone ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
            <div className="divide-y divide-slate-100">
              {[
                { icon: ScanFace, label: 'Face Recognition', desc: 'Require face verification for login', color: 'text-blue-500', bg: 'bg-blue-50', value: requireFace, toggle: () => handleBiometricToggle(setRequireFace, requireFace) },
                { icon: Fingerprint, label: 'Fingerprint', desc: 'Require fingerprint verification for login', color: 'text-green-500', bg: 'bg-green-50', value: requireFingerprint, toggle: () => handleBiometricToggle(setRequireFingerprint, requireFingerprint) },
                { icon: Mic, label: 'Voice Print', desc: 'Require voice verification for login', color: 'text-purple-500', bg: 'bg-purple-50', value: requireVoice, toggle: () => handleBiometricToggle(setRequireVoice, requireVoice) },
                { icon: Dice5, label: 'Random', desc: 'Randomly pick any enrolled biometric method', color: 'text-amber-500', bg: 'bg-amber-50', value: biometricRandom, toggle: () => handleBiometricRandom(!biometricRandom) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.bg}`}><item.icon className={`h-5 w-5 ${item.color}`} /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <button type="button" onClick={item.toggle}>
                    {item.value ? <ToggleRight className="h-8 w-8 text-red-600" /> : <ToggleLeft className="h-8 w-8 text-slate-300" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Select which biometric methods are required. "None" skips biometric verification entirely and "Random" selects one at random.</p>
      </section>

      {/* Challenge Verification */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Challenge Verification</h2>
        <div className="divide-y divide-slate-100">
          {/* None */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100"><Ban className="h-5 w-5 text-slate-400" /></div>
              <div>
                <p className="text-sm font-medium text-slate-900">None</p>
                <p className="text-xs text-slate-400">Only biometric verification is used</p>
              </div>
            </div>
            <button type="button" onClick={toggleChallengeNone}>
              {!Object.values(enabledMethods).some(v => v) ? <ToggleRight className="h-8 w-8 text-red-600" /> : <ToggleLeft className="h-8 w-8 text-slate-300" />}
            </button>
          </div>

          {/* Category toggles — collapse when None is active */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${!Object.values(enabledMethods).some(v => v) ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
          <div className="divide-y divide-slate-100">
          {([
            { catKey: 'otp', icon: Hash, label: 'OTP', desc: 'One-time password challenges', color: 'text-blue-500', bg: 'bg-blue-50', methods: CHALLENGE_METHODS.otp },
            { catKey: 'visual', icon: Eye, label: 'Visual Challenge', desc: 'Visual matching challenges', color: 'text-amber-500', bg: 'bg-amber-50', methods: CHALLENGE_METHODS.visual },
            { catKey: 'gesture', icon: Hand, label: 'Gesture', desc: 'Physical gesture challenges', color: 'text-indigo-500', bg: 'bg-indigo-50', methods: CHALLENGE_METHODS.gesture },
            { catKey: 'audio', icon: Mic, label: 'Audio', desc: 'Voice and sound challenges', color: 'text-pink-500', bg: 'bg-pink-50', methods: CHALLENGE_METHODS.audio },
            { catKey: 'random', icon: Shuffle, label: 'Random', desc: 'Different method each login', color: 'text-slate-500', bg: 'bg-slate-100', methods: [] as typeof CHALLENGE_METHODS.otp },
          ] as const).map((cat) => {
            const isCatActive = cat.catKey === 'random'
              ? !!enabledMethods['random']
              : cat.methods.some(m => enabledMethods[m.key]);

            return (
              <div key={cat.catKey}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${cat.bg}`}><cat.icon className={`h-5 w-5 ${cat.color}`} /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{cat.label}</p>
                      <p className="text-xs text-slate-400">{cat.desc}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => {
                    if (isCatActive) {
                      clearMethod();
                    } else if (cat.catKey === 'random') {
                      selectMethod('random');
                    } else if (cat.methods.length > 0) {
                      selectMethod(cat.methods[0].key);
                    }
                  }}>
                    {isCatActive ? <ToggleRight className="h-8 w-8 text-red-600" /> : <ToggleLeft className="h-8 w-8 text-slate-300" />}
                  </button>
                </div>
                {/* Expanded methods */}
                {isCatActive && cat.methods.length > 0 && (
                  <div className="pl-12 pb-3 space-y-1">
                    {cat.methods.map((item) => (
                      <ChallengeRadio key={item.key} item={item} accent="red" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Select which verification methods are required. "None" skips challenge verification entirely and "Random" selects one at random.</p>
      </section>

      {/* Access Management */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Access Management</h2>
        <p className="text-xs text-slate-400 mb-4">Manage who can access the Super Admin portal. Changes take effect immediately.</p>

        {/* Add email */}
        {approvalStatus === 'idle' && (
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addEmail(); }}
                placeholder="email@example.com"
                className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <button
              onClick={addEmail}
              disabled={whitelistSaving || !newEmail.trim().includes('@')}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              Add
            </button>
            <FieldAgentIcon action="add_admin_email" actionLabel="Add Admin Email" page="settings" />
          </div>
        )}

        {/* Approval waiting state */}
        {approvalStatus === 'waiting' && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <div className="flex justify-center mb-2">
              <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm font-semibold text-amber-800">Waiting for approval</p>
            <p className="text-xs text-amber-600 mt-1">
              Approve adding <span className="font-bold">{newEmail}</span> on your Flash ID app (Agents tab)
            </p>
            <button
              onClick={() => {
                if (pendingApproval) deleteDoc(doc(db, 'admin_approvals', pendingApproval));
                setPendingApproval(null);
                setApprovalStatus('idle');
              }}
              className="mt-3 text-xs text-amber-500 hover:text-amber-700 font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        {approvalStatus === 'approved' && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <p className="text-sm font-semibold text-green-800">Approved — email added</p>
          </div>
        )}

        {approvalStatus === 'denied' && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-sm font-semibold text-red-800">Denied — email not added</p>
          </div>
        )}

        {/* Email list */}
        {whitelistLoading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {whitelistEmails.map((email) => {
              const isCurrentUser = email.toLowerCase() === user.email?.toLowerCase();
              return (
                <div key={email} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <Users className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{email}</p>
                      {isCurrentUser && <p className="text-[10px] text-red-500 font-bold uppercase">You</p>}
                    </div>
                  </div>
                  {!isCurrentUser && (
                    <button
                      onClick={() => removeEmail(email)}
                      disabled={whitelistSaving}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-3">
          {whitelistEmails.length} authorized {whitelistEmails.length === 1 ? 'user' : 'users'}. You cannot remove yourself.
        </p>
      </section>

      {/* Save */}
      <div className="flex justify-end items-center gap-3">
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Settings saved
          </span>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
