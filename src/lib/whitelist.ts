import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from './firebase';

// Use the named database
const db = getFirestore(app, 'ai-studio-5104b9c1-7e74-4c52-9bdf-6e57ed9d5d3c');

// Whitelist is stored in Firestore at: superadmin_config/whitelist
// Document structure: { emails: string[] }
//
// Firestore rules restrict read/write to whitelisted emails only.
// If a non-whitelisted user tries to read, Firestore returns permission-denied.
// That error = not whitelisted = access denied.

const DEFAULT_EMAILS = ['okafifi@gmail.com', 'webauthor@gmail.com', 'omar@afifi.com'];

export async function isEmailWhitelisted(email: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'superadmin_config', 'whitelist');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      // Document doesn't exist yet — check hardcoded defaults
      return DEFAULT_EMAILS.includes(email.toLowerCase());
    }
    const data = snap.data();
    const emails: string[] = (data.emails || []).map((e: string) => e.toLowerCase());
    return emails.includes(email.toLowerCase());
  } catch (error: any) {
    // Firestore permission-denied = user is NOT whitelisted
    // This is expected for non-whitelisted users since the rules block them
    if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
      return false;
    }
    // For other errors (network, etc.), fall back to hardcoded list
    console.error('Whitelist check failed:', error);
    return DEFAULT_EMAILS.includes(email.toLowerCase());
  }
}
