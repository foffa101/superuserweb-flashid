/**
 * Security settings — Firestore-backed with localStorage cache.
 *
 * Firestore doc: user_settings/{uid}  (field: "superadmin")
 * localStorage keys kept in sync so QRVerification.tsx and sessions.ts
 * can read them without async calls during session creation.
 */

import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from './firebase';

const db = getFirestore(app, 'ai-studio-5104b9c1-7e74-4c52-9bdf-6e57ed9d5d3c');
const PREFIX = 'superadmin';
const PORTAL = 'superadmin';

export interface SecuritySettings {
  securityLevel: string;
  sessionTimeout: string;
  qrTimeout: string;
  pollInterval: string;
  redirectAfterLogin: string;
  requireFace: boolean;
  requireFingerprint: boolean;
  requireVoice: boolean;
  biometricNone: boolean;
  biometricRandom: boolean;
  verificationMethods: Record<string, boolean>;
}

const DEFAULTS: SecuritySettings = {
  securityLevel: 'secure',
  sessionTimeout: '4h',
  qrTimeout: '90',
  pollInterval: '1500',
  redirectAfterLogin: '/dashboard',
  requireFace: false,
  requireFingerprint: false,
  requireVoice: false,
  biometricNone: true,
  biometricRandom: false,
  verificationMethods: { type_code: true },
};

const KEY_MAP: Record<keyof SecuritySettings, string> = {
  securityLevel: 'security-level',
  sessionTimeout: 'session-timeout',
  qrTimeout: 'qr-timeout',
  pollInterval: 'poll-interval',
  redirectAfterLogin: 'redirect-after-login',
  requireFace: 'require-face',
  requireFingerprint: 'require-fingerprint',
  requireVoice: 'require-voice',
  biometricNone: 'biometric-none',
  biometricRandom: 'biometric-random',
  verificationMethods: 'verification-methods',
};

function lsKey(suffix: string): string {
  return `${PREFIX}-${suffix}`;
}

function syncToLocalStorage(settings: SecuritySettings): void {
  for (const [field, suffix] of Object.entries(KEY_MAP)) {
    const val = settings[field as keyof SecuritySettings];
    if (typeof val === 'boolean') {
      localStorage.setItem(lsKey(suffix), val ? '1' : '0');
    } else if (typeof val === 'object') {
      localStorage.setItem(lsKey(suffix), JSON.stringify(val));
    } else {
      localStorage.setItem(lsKey(suffix), String(val));
    }
  }
}

function readFromLocalStorage(): SecuritySettings {
  const getBool = (suffix: string, def: boolean): boolean => {
    const v = localStorage.getItem(lsKey(suffix));
    if (v === null) return def;
    return v === '1';
  };
  const getStr = (suffix: string, def: string): string =>
    localStorage.getItem(lsKey(suffix)) || def;

  let verificationMethods: Record<string, boolean> = { type_code: true };
  try {
    const raw = localStorage.getItem(lsKey('verification-methods'));
    if (raw) verificationMethods = JSON.parse(raw);
  } catch { /* use default */ }

  return {
    securityLevel: getStr('security-level', DEFAULTS.securityLevel),
    sessionTimeout: getStr('session-timeout', DEFAULTS.sessionTimeout),
    qrTimeout: getStr('qr-timeout', DEFAULTS.qrTimeout),
    pollInterval: getStr('poll-interval', DEFAULTS.pollInterval),
    redirectAfterLogin: getStr('redirect-after-login', DEFAULTS.redirectAfterLogin),
    requireFace: getBool('require-face', DEFAULTS.requireFace),
    requireFingerprint: getBool('require-fingerprint', DEFAULTS.requireFingerprint),
    requireVoice: getBool('require-voice', DEFAULTS.requireVoice),
    biometricNone: getBool('biometric-none', DEFAULTS.biometricNone),
    biometricRandom: getBool('biometric-random', DEFAULTS.biometricRandom),
    verificationMethods,
  };
}

export async function loadSecuritySettings(uid: string): Promise<SecuritySettings> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const snap = await getDoc(doc(db, 'user_settings', uid));
      if (snap.exists()) {
        const data = snap.data()?.[PORTAL];
        if (data) {
          const settings: SecuritySettings = { ...DEFAULTS, ...data };
          syncToLocalStorage(settings);
          return settings;
        }
      }
      break;
    } catch (e: any) {
      if (attempt === 0 && e?.code === 'permission-denied') {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      console.warn('[settings] Firestore load failed, using localStorage cache:', e);
    }
  }
  return readFromLocalStorage();
}

export async function saveSecuritySettings(uid: string, settings: SecuritySettings): Promise<void> {
  syncToLocalStorage(settings);
  try {
    await setDoc(doc(db, 'user_settings', uid), { [PORTAL]: settings }, { merge: true });
  } catch (e) {
    console.error('[settings] Firestore save failed:', e);
  }
}
