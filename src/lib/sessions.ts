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
export async function createSession(
  userId: string,
  verificationMethod?: string,
): Promise<{ sessionId: string; qrUrl: string; challenge: string }> {
  const sessionId = generateSessionId();
  const challenge = randomHex(16); // 32 hex chars
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 1000); // 90 seconds

  const session: AuthSession = {
    userId,
    status: 'pending',
    challenge,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    siteUrl: 'superadmin.flashid.com',
    siteName: 'Flash ID Super Admin',
    verifiedBy: null,
    biometricMethod: null,
  };

  if (verificationMethod && verificationMethod !== 'none') {
    session.challenge_data = generateChallenge(verificationMethod);
  }

  await setDoc(doc(db, 'auth_sessions', sessionId), session);

  let qrUrl = `flashid://auth?sid=${sessionId}&url=superadmin.flashid.com&name=${encodeURIComponent('Flash ID Super Admin')}&cb=firebase&ch=${challenge}`;
  if (verificationMethod && verificationMethod !== 'none') {
    qrUrl += `&m=${verificationMethod}`;
  }

  return { sessionId, qrUrl, challenge };
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
