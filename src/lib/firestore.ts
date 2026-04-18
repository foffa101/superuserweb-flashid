import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,

  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { app } from './firebase';
import type {
  Tenant,
  Invoice,
  BannedIP,
  PlatformEvent,
} from './api';

// ─── Named Firestore database ───
export const db = getFirestore(app, 'ai-studio-5104b9c1-7e74-4c52-9bdf-6e57ed9d5d3c');

// ─── Tenant Admin Login Info ───

export interface TenantAdminLogin {
  tenantId: string;
  email: string;
  lastLogin?: string;
  lastLoginTimezone?: string;
}

export async function getTenantAdminLogins(): Promise<TenantAdminLogin[]> {
  try {
    const snap = await getDocs(collection(db, 'tenant_admins'));
    return snap.docs.map((d) => d.data() as TenantAdminLogin);
  } catch (e) {
    console.error('Failed to get tenant admin logins:', e);
    return [];
  }
}

// ─── Tenants ───

export async function getTenants(): Promise<Tenant[]> {
  try {
    const snap = await getDocs(collection(db, 'tenants'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Tenant));
  } catch (e) {
    console.error('Failed to get tenants:', e);
    return [];
  }
}

export async function getTenant(id: string): Promise<Tenant | undefined> {
  try {
    const snap = await getDoc(doc(db, 'tenants', id));
    if (!snap.exists()) return undefined;
    return { id: snap.id, ...snap.data() } as Tenant;
  } catch (e) {
    console.error('Failed to get tenant:', e);
    return undefined;
  }
}

export async function createTenant(tenant: Tenant): Promise<void> {
  try {
    const { id, ...data } = tenant;
    await setDoc(doc(db, 'tenants', id), data);
  } catch (e) {
    console.error('Failed to create tenant:', e);
    throw e;
  }
}

export async function updateTenant(id: string, data: Partial<Tenant>): Promise<void> {
  try {
    // Remove id from data if present to avoid storing it as a field
    const { id: _id, ...rest } = data as Tenant;
    await updateDoc(doc(db, 'tenants', id), rest);
  } catch (e) {
    console.error('Failed to update tenant:', e);
    throw e;
  }
}

export async function deleteTenant(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'tenants', id));
  } catch (e) {
    console.error('Failed to delete tenant:', e);
    throw e;
  }
}

// ─── Invoices ───

export async function getInvoices(): Promise<Invoice[]> {
  try {
    const snap = await getDocs(collection(db, 'invoices'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice));
  } catch (e) {
    console.error('Failed to get invoices:', e);
    return [];
  }
}

export async function createInvoice(invoice: Invoice): Promise<void> {
  try {
    const { id, ...data } = invoice;
    await setDoc(doc(db, 'invoices', id), data);
  } catch (e) {
    console.error('Failed to create invoice:', e);
    throw e;
  }
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<void> {
  try {
    const { id: _id, ...rest } = data as Invoice;
    await updateDoc(doc(db, 'invoices', id), rest);
  } catch (e) {
    console.error('Failed to update invoice:', e);
    throw e;
  }
}

// ─── Platform Events ───

export async function getEvents(): Promise<PlatformEvent[]> {
  try {
    const q = query(collection(db, 'platform_events'), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PlatformEvent));
  } catch (e) {
    console.error('Failed to get events:', e);
    return [];
  }
}

export async function createEvent(event: PlatformEvent): Promise<void> {
  try {
    const { id, ...data } = event;
    await setDoc(doc(db, 'platform_events', id), data);
  } catch (e) {
    console.error('Failed to create event:', e);
    throw e;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'platform_events', id));
  } catch (e) {
    console.error('Failed to delete event:', e);
    throw e;
  }
}

export async function deleteAllEvents(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'platform_events'));
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (e) {
    console.error('Failed to delete all events:', e);
    throw e;
  }
}

// ─── Banned IPs ───

export async function getBannedIPs(): Promise<BannedIP[]> {
  try {
    const snap = await getDocs(collection(db, 'banned_ips'));
    return snap.docs.map((d) => ({ ...d.data(), _docId: d.id } as BannedIP & { _docId: string }));
  } catch (e) {
    console.error('Failed to get banned IPs:', e);
    return [];
  }
}

export async function addBannedIP(ban: BannedIP): Promise<void> {
  try {
    // Use IP as document ID (replace dots with underscores for valid doc ID)
    const docId = ban.ip.replace(/\./g, '_');
    await setDoc(doc(db, 'banned_ips', docId), ban);
  } catch (e) {
    console.error('Failed to add banned IP:', e);
    throw e;
  }
}

export async function removeBannedIP(ip: string): Promise<void> {
  try {
    const docId = ip.replace(/\./g, '_');
    await deleteDoc(doc(db, 'banned_ips', docId));
  } catch (e) {
    console.error('Failed to remove banned IP:', e);
    throw e;
  }
}

// ─── Platform Config / Stats ───

export interface PlatformStats {
  totalSites: number;
  totalSessionsToday: number;
  totalActiveUsers: number;
  platformSuccessRate: number;
  systemHealth: 'operational' | 'degraded' | 'down';
}

export async function getStats(): Promise<PlatformStats> {
  try {
    const snap = await getDoc(doc(db, 'platform_config', 'stats'));
    if (snap.exists()) return snap.data() as PlatformStats;
    // Return defaults
    return {
      totalSites: 0,
      totalSessionsToday: 0,
      totalActiveUsers: 0,
      platformSuccessRate: 0,
      systemHealth: 'operational',
    };
  } catch (e) {
    console.error('Failed to get stats:', e);
    return {
      totalSites: 0,
      totalSessionsToday: 0,
      totalActiveUsers: 0,
      platformSuccessRate: 0,
      systemHealth: 'operational',
    };
  }
}

export async function updateStats(data: Partial<PlatformStats>): Promise<void> {
  try {
    await setDoc(doc(db, 'platform_config', 'stats'), data, { merge: true });
  } catch (e) {
    console.error('Failed to update stats:', e);
    throw e;
  }
}

// ─── Security Config / Settings ───

export interface SecuritySettings {
  globalRateLimit: number;
  banThreshold: number;
  banDuration: number;
  banAction: 'block' | 'throttle';
  geoEnabled: boolean;
  geoCacheDuration: number;
  defaultSessionTimeout: number;
  maxSessionTimeout: number;
  minPollInterval: number;
  defaultUserPolicy: 'allow' | 'reject';
  rotationDays: number;
  lastRotated: string;
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  try {
    const snap = await getDoc(doc(db, 'security_config', 'settings'));
    if (snap.exists()) return snap.data() as SecuritySettings;
    // Return defaults
    return {
      globalRateLimit: 30,
      banThreshold: 5,
      banDuration: 60,
      banAction: 'block',
      geoEnabled: true,
      geoCacheDuration: 24,
      defaultSessionTimeout: 90,
      maxSessionTimeout: 300,
      minPollInterval: 500,
      defaultUserPolicy: 'allow',
      rotationDays: 90,
      lastRotated: '2026-03-15T10:00:00Z',
    };
  } catch (e) {
    console.error('Failed to get security settings:', e);
    return {
      globalRateLimit: 30,
      banThreshold: 5,
      banDuration: 60,
      banAction: 'block',
      geoEnabled: true,
      geoCacheDuration: 24,
      defaultSessionTimeout: 90,
      maxSessionTimeout: 300,
      minPollInterval: 500,
      defaultUserPolicy: 'allow',
      rotationDays: 90,
      lastRotated: '2026-03-15T10:00:00Z',
    };
  }
}

export async function updateSecuritySettings(data: Partial<SecuritySettings>): Promise<void> {
  try {
    await setDoc(doc(db, 'security_config', 'settings'), data, { merge: true });
  } catch (e) {
    console.error('Failed to update security settings:', e);
    throw e;
  }
}

// ─── Field Agents ───

export const FIELD_AGENT_SCOPES = [
  'identity-verify',
  'transaction-verify',
  'order-confirm',
  'booking-confirm',
  'check-in',
  'db-config',
  'modify-config',
  'prescription-access',
  'rx-refill',
  'hipaa-auth',
  'access-control',
  'data-export',
  'user-management',
  'billing-action',
  'security-change',
  'system-config',
] as const;

export type FieldAgentScope = typeof FIELD_AGENT_SCOPES[number];

export interface FieldAgent {
  id: string;
  action: string;
  actionLabel: string;
  page: string;
  siteName: string;
  scope: FieldAgentScope | string;
  notifyEmails: string[];
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  timeoutSeconds: number;
}

export async function getFieldAgents(): Promise<FieldAgent[]> {
  try {
    const snap = await getDocs(collection(db, 'field_agents'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FieldAgent));
  } catch (e) {
    console.error('Failed to get field agents:', e);
    return [];
  }
}

export async function getFieldAgentForAction(action: string): Promise<FieldAgent | null> {
  try {
    const snap = await getDoc(doc(db, 'field_agents', action));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as FieldAgent;
  } catch {
    return null;
  }
}

export async function saveFieldAgent(agent: FieldAgent): Promise<void> {
  try {
    const { id, ...data } = agent;
    await setDoc(doc(db, 'field_agents', id), data);
  } catch (e) {
    console.error('Failed to save field agent:', e);
    throw e;
  }
}

export async function deleteFieldAgent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'field_agents', id));
  } catch (e) {
    console.error('Failed to delete field agent:', e);
    throw e;
  }
}

export async function createApprovalRequest(data: {
  type: string;
  action: string;
  actionLabel: string;
  page: string;
  siteName?: string;
  scope?: string;
  details: string;
  requestedBy: string;
  requestedByUid: string;
  notifyEmails: string[];
  timeoutSeconds?: number;
}): Promise<string> {
  const timeout = data.timeoutSeconds || 120;

  // Check for existing pending approval for same action + user
  const existing = await getDocs(
    query(
      collection(db, 'admin_approvals'),
      where('action', '==', data.action),
      where('requestedByUid', '==', data.requestedByUid),
      where('status', '==', 'pending'),
    ),
  );

  // If a non-expired pending approval exists, reuse it
  const now = new Date().toISOString();
  for (const d of existing.docs) {
    const expiresAt = d.data().expiresAt as string | null;
    if (!expiresAt || expiresAt > now) return d.id;
    // Expired — clean it up
    await deleteDoc(d.ref);
  }

  const approvalId = `approval_${Date.now()}`;
  await setDoc(doc(db, 'admin_approvals', approvalId), {
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: timeout === 0 ? null : new Date(Date.now() + timeout * 1000).toISOString(),
  });
  return approvalId;
}

// ─── WP Events ───

export type WpEventType =
  | 'license_activated'
  | 'license_deactivated'
  | 'license_renewed'
  | 'domain_added'
  | 'domain_removed'
  | 'tenant_created'
  | 'admin_login'
  | 'enrollment_approved'
  | 'enrollment_rejected';

export interface WpEvent {
  id: string;
  timestamp: string;
  eventType: WpEventType;
  tenantName: string;
  domain: string;
  adminEmail: string;
  status: 'success' | 'failed';
  details: string;
}

export async function getWpEvents(): Promise<WpEvent[]> {
  try {
    const q = query(
      collection(db, 'wp_events'),
      orderBy('timestamp', 'desc'),
      limit(50),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WpEvent));
  } catch (e) {
    console.error('Failed to get WP events:', e);
    return [];
  }
}

// ─── Seed Initial Data ───

export async function seedInitialData(): Promise<void> {
  try {
    // Check if tenants collection is empty
    const tenantsSnap = await getDocs(query(collection(db, 'tenants'), limit(1)));
    if (!tenantsSnap.empty) return; // Already seeded

    console.log('Seeding initial data...');

    // Import mock data for seeding
    const { mockTenants, mockInvoices, mockBannedIPs, mockEvents, platformStats } = await import('./api');

    // Seed tenants
    const tenantPromises = mockTenants.map((t) => {
      const { id, ...data } = t;
      return setDoc(doc(db, 'tenants', id), data);
    });

    // Seed invoices
    const invoicePromises = mockInvoices.map((inv) => {
      const { id, ...data } = inv;
      return setDoc(doc(db, 'invoices', id), data);
    });

    // Seed events
    const eventPromises = mockEvents.map((evt) => {
      const { id, ...data } = evt;
      return setDoc(doc(db, 'platform_events', id), data);
    });

    // Seed banned IPs
    const banPromises = mockBannedIPs.map((ban) => {
      const docId = ban.ip.replace(/\./g, '_');
      return setDoc(doc(db, 'banned_ips', docId), ban);
    });

    // Seed platform stats
    const statsPromise = setDoc(doc(db, 'platform_config', 'stats'), platformStats);

    // Seed default security settings
    const securityPromise = setDoc(doc(db, 'security_config', 'settings'), {
      globalRateLimit: 30,
      banThreshold: 5,
      banDuration: 60,
      banAction: 'block',
      geoEnabled: true,
      geoCacheDuration: 24,
      defaultSessionTimeout: 90,
      maxSessionTimeout: 300,
      minPollInterval: 500,
      defaultUserPolicy: 'allow',
      rotationDays: 90,
      lastRotated: '2026-03-15T10:00:00Z',
    });

    await Promise.all([
      ...tenantPromises,
      ...invoicePromises,
      ...eventPromises,
      ...banPromises,
      statsPromise,
      securityPromise,
    ]);

    console.log('Initial data seeded successfully.');
  } catch (e) {
    console.error('Failed to seed initial data:', e);
  }
}
