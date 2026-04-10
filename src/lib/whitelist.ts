import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from './firebase';

// Use the named database
const db = getFirestore(app, 'ai-studio-5104b9c1-7e74-4c52-9bdf-6e57ed9d5d3c');

// Whitelist is stored in Firestore at: superadmin_config/whitelist
// Document structure: { emails: string[] }

const DEFAULT_EMAILS = ['okafifi@gmail.com', 'webauthor@gmail.com'];

export async function isEmailWhitelisted(email: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'superadmin_config', 'whitelist');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      // If no whitelist doc exists, seed it with defaults and allow
      await seedWhitelist();
      return DEFAULT_EMAILS.includes(email.toLowerCase());
    }
    const data = snap.data();
    const emails: string[] = (data.emails || []).map((e: string) => e.toLowerCase());
    return emails.includes(email.toLowerCase());
  } catch (error) {
    console.error('Whitelist check failed:', error);
    // If Firestore fails, fall back to hardcoded list for safety
    return DEFAULT_EMAILS.includes(email.toLowerCase());
  }
}

export async function getWhitelist(): Promise<string[]> {
  try {
    const docRef = doc(db, 'superadmin_config', 'whitelist');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await seedWhitelist();
      return [...DEFAULT_EMAILS];
    }
    return snap.data().emails || [];
  } catch {
    return [...DEFAULT_EMAILS];
  }
}

export async function addToWhitelist(email: string): Promise<string[]> {
  const current = await getWhitelist();
  const normalized = email.toLowerCase().trim();
  if (current.map(e => e.toLowerCase()).includes(normalized)) return current;
  const updated = [...current, normalized];
  await setDoc(doc(db, 'superadmin_config', 'whitelist'), { emails: updated });
  return updated;
}

export async function removeFromWhitelist(email: string): Promise<string[]> {
  const current = await getWhitelist();
  const normalized = email.toLowerCase().trim();
  const updated = current.filter(e => e.toLowerCase() !== normalized);
  await setDoc(doc(db, 'superadmin_config', 'whitelist'), { emails: updated });
  return updated;
}

async function seedWhitelist() {
  await setDoc(doc(db, 'superadmin_config', 'whitelist'), {
    emails: [...DEFAULT_EMAILS],
  });
}
