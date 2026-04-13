/**
 * QR verification session management via Firestore.
 * Collection: auth_sessions/{sessionId}
 *
 * The Flash ID mobile app reads these sessions and approves/denies them.
 */

import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { app } from './firebase';
import { generateChallenge, type ChallengeData } from './challenges';

const db = getFirestore(app, 'ai-studio-5104b9c1-7e74-4c52-9bdf-6e57ed9d5d3c');

export interface AuthSession {
  userId: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  challenge: string;
  createdAt: string;
  expiresAt: string;
  siteUrl: string;
  siteName: string;
  verifiedBy: string | null;
  biometricMethod: string | null;
  uid?: string; // Firebase UID of the approver (set by the app)
  challenge_data?: ChallengeData;
  challenge_response?: Record<string, unknown>;
  scanned?: boolean; // Set by the app when QR is scanned
}

/** Generate a random hex string of the given byte-length (default 16 -> 32 hex chars). */
function randomHex(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Generate a UUID-v4-like identifier. */
function generateSessionId(): string {
  return `${randomHex(4)}-${randomHex(2)}-${randomHex(2)}-${randomHex(2)}-${randomHex(6)}`;
}

/**
 * Create a new QR verification session in Firestore.
 * Returns the session ID, a deep-link URL for the mobile app, and the challenge.
 */
export interface BiometricRequirements {
  face?: boolean;
  fingerprint?: boolean;
  voice?: boolean;
}

export async function createSession(
  userId: string,
  verificationMethod?: string,
  biometrics?: BiometricRequirements,
  qrTimeoutSeconds?: number,
): Promise<{ sessionId: string; qrUrl: string; challenge: string; qrTimeout: number }> {
  const qrTimeout = qrTimeoutSeconds || parseInt(localStorage.getItem('superadmin-qr-timeout') || '90') || 90;
  const sessionId = generateSessionId();
  const challenge = randomHex(16); // 32 hex chars
  const now = new Date();
  const expiresAt = new Date(now.getTime() + qrTimeout * 1000);

  const session: AuthSession = {
    userId,
    status: 'pending',
    challenge,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    siteUrl: window.location.origin,
    siteName: 'Flash ID Super Admin',
    verifiedBy: null,
    biometricMethod: null,
  };

  if (verificationMethod && verificationMethod !== 'none') {
    session.challenge_data = generateChallenge(verificationMethod);
  }

  await setDoc(doc(db, 'auth_sessions', sessionId), session);

  const siteOrigin = window.location.origin;
  let qrUrl = `flashid://auth?sid=${sessionId}&url=${encodeURIComponent(siteOrigin)}&name=${encodeURIComponent('Flash ID Super Admin')}&cb=firebase&ch=${challenge}`;
  qrUrl += `&v=${biometrics?.face ? '1' : '0'}&k=${biometrics?.fingerprint ? '1' : '0'}&w=${biometrics?.voice ? '1' : '0'}`;
  if (verificationMethod && verificationMethod !== 'none') {
    qrUrl += `&m=${verificationMethod}`;
  }

  return { sessionId, qrUrl, challenge, qrTimeout };
}

/**
 * Subscribe to real-time status changes on a session document.
 * Returns an unsubscribe function.
 */
export function subscribeToSession(
  sessionId: string,
  callback: (session: AuthSession | null) => void
): () => void {
  return onSnapshot(
    doc(db, 'auth_sessions', sessionId),
    (snap: any) => {
      const data = snap.data?.() ?? snap.data;
      callback(data || null);
    },
    (error: any) => {
      console.error('Session snapshot error:', error);
    }
  );
}
