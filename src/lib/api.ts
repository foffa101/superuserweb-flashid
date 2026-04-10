// ─── Types ───

export type TenantType = 'wp' | 'api';

export type WPPlan = 'WP - Standard' | 'WP - Agency';

export type APIPlan = 'API - Per Call' | 'API - Starter' | 'API - Growth' | 'API - Business' | 'API - Unlimited' | 'API - Enterprise';

export type Plan = WPPlan | APIPlan;

export type TenantStatus = 'active' | 'suspended' | 'cancelled';

export type LicenseStatus = 'active' | 'expired' | 'suspended';

export type BillingCycle = 'monthly' | 'annual';

export type InvoiceStatus = 'paid' | 'unpaid' | 'pending';

export interface Tenant {
  id: string;
  name: string;
  email: string;
  type: TenantType;
  plan: Plan;
  status: TenantStatus;
  createdAt: string;
  notes: string;
  // WP fields
  licenseKey?: string;
  licenseStatus?: LicenseStatus;
  licensedSites?: string[];
  licenseExpiry?: string;
  // API fields
  orgName?: string;
  billingCycle?: BillingCycle;
  apiKeyHalf?: string;
  pricePerCall?: number;
  callsThisMonth?: number;
  callsIncluded?: number;
  callsUsed?: number;
  resetDate?: string;
  customPrice?: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  date: string;
  plan: Plan;
  usage: number;
  amount: number;
  status: InvoiceStatus;
}

export interface BillingSummary {
  totalActiveTenants: number;
  totalWPLicenses: number;
  totalAPICallsThisMonth: number;
  estimatedRevenueThisMonth: number;
}

// ─── Helper generators ───

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const seg = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `WP-${seg(4)}-${seg(4)}-${seg(4)}`;
}

export function generateApiKeyHalf(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return 'fid_' + Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Mock Tenants ───

export const mockTenants: Tenant[] = [
  {
    id: 't1',
    name: 'Acme Corp',
    email: 'admin@acme-corp.com',
    type: 'wp',
    plan: 'WP - Standard',
    status: 'active',
    createdAt: '2025-08-14T10:30:00Z',
    notes: 'Long-time customer, renewed twice.',
    licenseKey: 'WP-ACME-2026-XXXX',
    licenseStatus: 'active',
    licensedSites: ['https://acme-corp.com'],
    licenseExpiry: '2027-08-14T10:30:00Z',
  },
  {
    id: 't2',
    name: 'WebDev Agency',
    email: 'billing@webdevagency.io',
    type: 'wp',
    plan: 'WP - Agency',
    status: 'active',
    createdAt: '2025-11-02T14:15:00Z',
    notes: 'Agency plan with 4 active client sites.',
    licenseKey: 'WP-WDEV-2026-AB12',
    licenseStatus: 'active',
    licensedSites: [
      'https://client-alpha.com',
      'https://client-beta.io',
      'https://client-gamma.net',
      'https://client-delta.org',
    ],
    licenseExpiry: '2027-11-02T14:15:00Z',
  },
  {
    id: 't3',
    name: 'FinSecure Inc',
    email: 'ops@finsecure.com',
    type: 'api',
    plan: 'API - Business',
    status: 'active',
    createdAt: '2025-06-10T09:00:00Z',
    notes: 'Financial services company, high volume.',
    orgName: 'FinSecure Inc',
    billingCycle: 'monthly',
    apiKeyHalf: 'fid_k8xj29mpqr',
    callsIncluded: 50000,
    callsUsed: 38420,
    callsThisMonth: 38420,
    resetDate: '2026-05-01T00:00:00Z',
  },
  {
    id: 't4',
    name: 'StartupXYZ',
    email: 'dev@startupxyz.co',
    type: 'api',
    plan: 'API - Starter',
    status: 'active',
    createdAt: '2026-01-20T09:45:00Z',
    notes: 'Early-stage startup, evaluating.',
    orgName: 'StartupXYZ',
    billingCycle: 'monthly',
    apiKeyHalf: 'fid_mn7bv2cx9d',
    callsIncluded: 1000,
    callsUsed: 780,
    callsThisMonth: 780,
    resetDate: '2026-05-01T00:00:00Z',
  },
  {
    id: 't5',
    name: 'MegaBank',
    email: 'security@megabank.com',
    type: 'api',
    plan: 'API - Enterprise',
    status: 'active',
    createdAt: '2025-03-01T11:00:00Z',
    notes: 'Enterprise deal, custom pricing at $5,000/mo.',
    orgName: 'MegaBank International',
    billingCycle: 'annual',
    apiKeyHalf: 'fid_hg4fd7sa1k',
    customPrice: 5000,
    callsThisMonth: 124500,
    callsUsed: 124500,
    resetDate: '2026-05-01T00:00:00Z',
  },
  {
    id: 't6',
    name: 'SmallBiz Co',
    email: 'owner@smallbiz.co',
    type: 'api',
    plan: 'API - Per Call',
    status: 'active',
    createdAt: '2026-02-11T16:20:00Z',
    notes: 'Pay-per-call customer.',
    orgName: 'SmallBiz Co',
    billingCycle: 'monthly',
    apiKeyHalf: 'fid_zq5we8rt3y',
    pricePerCall: 0.02,
    callsThisMonth: 2340,
    callsUsed: 2340,
    resetDate: '2026-05-01T00:00:00Z',
  },
  {
    id: 't7',
    name: 'HealthTech',
    email: 'admin@healthtech.io',
    type: 'api',
    plan: 'API - Growth',
    status: 'suspended',
    createdAt: '2025-09-15T08:00:00Z',
    notes: 'Suspended for non-payment.',
    orgName: 'HealthTech Solutions',
    billingCycle: 'monthly',
    apiKeyHalf: 'fid_ty2ui5op8a',
    callsIncluded: 10000,
    callsUsed: 0,
    callsThisMonth: 0,
    resetDate: '2026-05-01T00:00:00Z',
  },
  {
    id: 't8',
    name: 'OldClient LLC',
    email: 'contact@oldclient.com',
    type: 'wp',
    plan: 'WP - Standard',
    status: 'cancelled',
    createdAt: '2024-12-01T10:00:00Z',
    notes: 'Cancelled subscription, license expired.',
    licenseKey: 'WP-OLDC-2025-ZZ99',
    licenseStatus: 'expired',
    licensedSites: ['https://oldclient.com'],
    licenseExpiry: '2025-12-01T10:00:00Z',
  },
];

// ─── Mock Invoices ───

export const mockInvoices: Invoice[] = [
  { id: 'inv-001', tenantId: 't1', date: '2026-04-01', plan: 'WP - Standard', usage: 1, amount: 49, status: 'paid' },
  { id: 'inv-002', tenantId: 't1', date: '2026-03-01', plan: 'WP - Standard', usage: 1, amount: 49, status: 'paid' },
  { id: 'inv-003', tenantId: 't2', date: '2026-04-01', plan: 'WP - Agency', usage: 4, amount: 149, status: 'paid' },
  { id: 'inv-004', tenantId: 't2', date: '2026-03-01', plan: 'WP - Agency', usage: 3, amount: 149, status: 'paid' },
  { id: 'inv-005', tenantId: 't3', date: '2026-04-01', plan: 'API - Business', usage: 38420, amount: 299, status: 'pending' },
  { id: 'inv-006', tenantId: 't3', date: '2026-03-01', plan: 'API - Business', usage: 42100, amount: 299, status: 'paid' },
  { id: 'inv-007', tenantId: 't3', date: '2026-02-01', plan: 'API - Business', usage: 39800, amount: 299, status: 'paid' },
  { id: 'inv-008', tenantId: 't4', date: '2026-04-01', plan: 'API - Starter', usage: 780, amount: 29, status: 'pending' },
  { id: 'inv-009', tenantId: 't4', date: '2026-03-01', plan: 'API - Starter', usage: 650, amount: 29, status: 'paid' },
  { id: 'inv-010', tenantId: 't5', date: '2026-04-01', plan: 'API - Enterprise', usage: 124500, amount: 5000, status: 'paid' },
  { id: 'inv-011', tenantId: 't5', date: '2026-03-01', plan: 'API - Enterprise', usage: 118200, amount: 5000, status: 'paid' },
  { id: 'inv-012', tenantId: 't5', date: '2026-02-01', plan: 'API - Enterprise', usage: 109400, amount: 5000, status: 'paid' },
  { id: 'inv-013', tenantId: 't6', date: '2026-04-01', plan: 'API - Per Call', usage: 2340, amount: 46.80, status: 'unpaid' },
  { id: 'inv-014', tenantId: 't6', date: '2026-03-01', plan: 'API - Per Call', usage: 1890, amount: 37.80, status: 'paid' },
  { id: 'inv-015', tenantId: 't7', date: '2026-03-01', plan: 'API - Growth', usage: 8200, amount: 99, status: 'unpaid' },
  { id: 'inv-016', tenantId: 't7', date: '2026-02-01', plan: 'API - Growth', usage: 7400, amount: 99, status: 'paid' },
  { id: 'inv-017', tenantId: 't8', date: '2025-11-01', plan: 'WP - Standard', usage: 1, amount: 49, status: 'paid' },
  { id: 'inv-018', tenantId: 't8', date: '2025-10-01', plan: 'WP - Standard', usage: 1, amount: 49, status: 'paid' },
];

// ─── API functions ───

export function getTenants(): Tenant[] {
  return mockTenants;
}

export function getTenant(id: string): Tenant | undefined {
  return mockTenants.find((t) => t.id === id);
}

export function updateTenant(id: string, data: Partial<Tenant>): Tenant | undefined {
  const idx = mockTenants.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  mockTenants[idx] = { ...mockTenants[idx], ...data };
  return mockTenants[idx];
}

export function getBillingSummary(): BillingSummary {
  const activeTenants = mockTenants.filter((t) => t.status === 'active');
  const wpLicenses = activeTenants.filter((t) => t.type === 'wp' && t.licenseStatus === 'active').length;
  const apiCalls = activeTenants
    .filter((t) => t.type === 'api')
    .reduce((sum, t) => sum + (t.callsThisMonth || 0), 0);

  // Estimate revenue from current month invoices
  const currentMonthInvoices = mockInvoices.filter((inv) => inv.date.startsWith('2026-04'));
  const revenue = currentMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return {
    totalActiveTenants: activeTenants.length,
    totalWPLicenses: wpLicenses,
    totalAPICallsThisMonth: apiCalls,
    estimatedRevenueThisMonth: revenue,
  };
}

export function getInvoices(tenantId?: string): Invoice[] {
  if (tenantId) return mockInvoices.filter((inv) => inv.tenantId === tenantId);
  return mockInvoices;
}

export function markInvoicePaid(id: string): Invoice | undefined {
  const inv = mockInvoices.find((i) => i.id === id);
  if (inv) inv.status = 'paid';
  return inv;
}

// ─── Banned IPs ───

export interface BannedIP {
  ip: string;
  reason: string;
  tenantId: string;
  tenantName: string;
  bannedAt: string;
  expiresAt: string | null; // null = permanent
}

export const mockBannedIPs: BannedIP[] = [
  {
    ip: '192.168.44.12',
    reason: 'Exceeded failed attempt threshold (23 attempts)',
    tenantId: 't1',
    tenantName: 'Acme Corp',
    bannedAt: '2026-04-09T03:12:00Z',
    expiresAt: '2026-04-09T04:12:00Z',
  },
  {
    ip: '10.0.0.88',
    reason: 'Automated brute-force detected',
    tenantId: 't4',
    tenantName: 'BadActor Shop',
    bannedAt: '2026-03-14T22:05:00Z',
    expiresAt: null,
  },
  {
    ip: '203.0.113.42',
    reason: 'Rate limit exceeded (350 req/min)',
    tenantId: 't2',
    tenantName: 'Northwind Traders',
    bannedAt: '2026-04-08T17:30:00Z',
    expiresAt: '2026-04-08T18:30:00Z',
  },
  {
    ip: '198.51.100.7',
    reason: 'Suspicious callback replay attack',
    tenantId: 't5',
    tenantName: 'CloudBank Finance',
    bannedAt: '2026-04-07T09:44:00Z',
    expiresAt: null,
  },
  {
    ip: '172.16.33.101',
    reason: 'Exceeded failed attempt threshold (11 attempts)',
    tenantId: 't3',
    tenantName: 'TechStartup.dev',
    bannedAt: '2026-04-09T01:20:00Z',
    expiresAt: '2026-04-09T02:20:00Z',
  },
];

// ─── Platform Events ───

export type EventType =
  | 'session_created'
  | 'session_verified'
  | 'session_expired'
  | 'session_failed'
  | 'rate_limit_hit'
  | 'ip_banned'
  | 'ip_unbanned'
  | 'api_key_rotated'
  | 'tenant_suspended'
  | 'tenant_activated'
  | 'settings_updated'
  | 'login';

export type EventStatus = 'success' | 'warning' | 'error' | 'info';

export interface PlatformEvent {
  id: string;
  timestamp: string;
  tenantId: string;
  tenantName: string;
  eventType: EventType;
  ip: string;
  location: string;
  status: EventStatus;
  details: string;
}

export const mockEvents: PlatformEvent[] = [
  { id: 'e1', timestamp: '2026-04-09T08:14:02Z', tenantId: 't5', tenantName: 'CloudBank Finance', eventType: 'session_verified', ip: '44.192.55.10', location: 'New York, US', status: 'success', details: 'Session sid_9f8e7d verified successfully' },
  { id: 'e2', timestamp: '2026-04-09T08:12:44Z', tenantId: 't1', tenantName: 'Acme Corp', eventType: 'session_created', ip: '52.14.88.201', location: 'Columbus, US', status: 'info', details: 'New session sid_a1b2c3 initiated' },
  { id: 'e3', timestamp: '2026-04-09T08:10:31Z', tenantId: 't2', tenantName: 'Northwind Traders', eventType: 'session_verified', ip: '18.220.33.77', location: 'Dublin, IE', status: 'success', details: 'Session sid_d4e5f6 verified successfully' },
  { id: 'e4', timestamp: '2026-04-09T08:05:18Z', tenantId: 't6', tenantName: 'PixelArt Studio', eventType: 'session_expired', ip: '203.0.113.55', location: 'Tokyo, JP', status: 'warning', details: 'Session sid_g7h8i9 expired after 90s timeout' },
  { id: 'e5', timestamp: '2026-04-09T07:55:19Z', tenantId: 't2', tenantName: 'Northwind Traders', eventType: 'session_created', ip: '18.220.33.77', location: 'Dublin, IE', status: 'info', details: 'New session sid_j0k1l2 initiated' },
  { id: 'e6', timestamp: '2026-04-09T07:48:02Z', tenantId: 't1', tenantName: 'Acme Corp', eventType: 'rate_limit_hit', ip: '192.168.44.12', location: 'Shanghai, CN', status: 'warning', details: 'IP exceeded 30 req/min limit' },
  { id: 'e7', timestamp: '2026-04-09T07:45:00Z', tenantId: 't3', tenantName: 'TechStartup.dev', eventType: 'session_failed', ip: '172.16.33.101', location: 'Berlin, DE', status: 'error', details: 'Session sid_m3n4o5 failed: invalid signature' },
  { id: 'e8', timestamp: '2026-04-09T07:30:11Z', tenantId: 't5', tenantName: 'CloudBank Finance', eventType: 'session_verified', ip: '44.192.55.10', location: 'New York, US', status: 'success', details: 'Session sid_p6q7r8 verified successfully' },
  { id: 'e9', timestamp: '2026-04-09T06:42:18Z', tenantId: 't6', tenantName: 'PixelArt Studio', eventType: 'session_created', ip: '103.21.244.0', location: 'Singapore, SG', status: 'info', details: 'New session sid_s9t0u1 initiated' },
  { id: 'e10', timestamp: '2026-04-09T06:15:44Z', tenantId: 't1', tenantName: 'Acme Corp', eventType: 'session_verified', ip: '52.14.88.201', location: 'Columbus, US', status: 'success', details: 'Session sid_v2w3x4 verified successfully' },
  { id: 'e11', timestamp: '2026-04-09T05:58:33Z', tenantId: 't5', tenantName: 'CloudBank Finance', eventType: 'api_key_rotated', ip: '44.192.55.10', location: 'New York, US', status: 'info', details: 'API key rotated by security@cloudbank.finance' },
  { id: 'e12', timestamp: '2026-04-09T05:30:00Z', tenantId: 't2', tenantName: 'Northwind Traders', eventType: 'session_verified', ip: '34.245.12.99', location: 'London, GB', status: 'success', details: 'Session sid_y5z6a7 verified successfully' },
  { id: 'e13', timestamp: '2026-04-09T04:45:21Z', tenantId: 't3', tenantName: 'TechStartup.dev', eventType: 'session_created', ip: '91.108.12.34', location: 'Berlin, DE', status: 'info', details: 'New session sid_b8c9d0 initiated' },
  { id: 'e14', timestamp: '2026-04-09T03:12:00Z', tenantId: 't1', tenantName: 'Acme Corp', eventType: 'ip_banned', ip: '192.168.44.12', location: 'Shanghai, CN', status: 'error', details: 'IP auto-banned: 23 failed attempts in 10 minutes' },
  { id: 'e15', timestamp: '2026-04-09T02:50:44Z', tenantId: 't5', tenantName: 'CloudBank Finance', eventType: 'session_verified', ip: '44.192.55.10', location: 'New York, US', status: 'success', details: 'Session sid_e1f2g3 verified successfully' },
  { id: 'e16', timestamp: '2026-04-09T01:20:00Z', tenantId: 't3', tenantName: 'TechStartup.dev', eventType: 'ip_banned', ip: '172.16.33.101', location: 'Berlin, DE', status: 'error', details: 'IP auto-banned: 11 failed attempts in 5 minutes' },
  { id: 'e17', timestamp: '2026-04-08T22:31:07Z', tenantId: 't3', tenantName: 'TechStartup.dev', eventType: 'session_expired', ip: '91.108.12.34', location: 'Berlin, DE', status: 'warning', details: 'Session sid_h4i5j6 expired after 90s timeout' },
  { id: 'e18', timestamp: '2026-04-08T21:15:00Z', tenantId: 't1', tenantName: 'Acme Corp', eventType: 'settings_updated', ip: '52.14.88.201', location: 'Columbus, US', status: 'info', details: 'Session timeout changed from 60s to 90s' },
  { id: 'e19', timestamp: '2026-04-08T19:44:33Z', tenantId: 't6', tenantName: 'PixelArt Studio', eventType: 'session_verified', ip: '103.21.244.0', location: 'Singapore, SG', status: 'success', details: 'Session sid_k7l8m9 verified successfully' },
  { id: 'e20', timestamp: '2026-04-08T18:30:00Z', tenantId: 't2', tenantName: 'Northwind Traders', eventType: 'ip_unbanned', ip: '203.0.113.42', location: 'Seoul, KR', status: 'info', details: 'IP ban expired after 60 minute duration' },
  { id: 'e21', timestamp: '2026-04-08T17:30:00Z', tenantId: 't2', tenantName: 'Northwind Traders', eventType: 'ip_banned', ip: '203.0.113.42', location: 'Seoul, KR', status: 'error', details: 'IP auto-banned: rate limit exceeded (350 req/min)' },
  { id: 'e22', timestamp: '2026-04-08T16:05:12Z', tenantId: 't5', tenantName: 'CloudBank Finance', eventType: 'session_created', ip: '44.192.55.10', location: 'New York, US', status: 'info', details: 'New session sid_n0o1p2 initiated' },
  { id: 'e23', timestamp: '2026-04-08T14:22:45Z', tenantId: 't1', tenantName: 'Acme Corp', eventType: 'session_verified', ip: '52.14.88.201', location: 'Columbus, US', status: 'success', details: 'Session sid_q3r4s5 verified successfully' },
  { id: 'e24', timestamp: '2026-04-08T12:00:00Z', tenantId: 't4', tenantName: 'BadActor Shop', eventType: 'tenant_suspended', ip: '198.51.100.7', location: 'Unknown', status: 'error', details: 'Tenant suspended by platform admin: abuse detected' },
  { id: 'e25', timestamp: '2026-04-08T10:33:18Z', tenantId: 't6', tenantName: 'PixelArt Studio', eventType: 'session_failed', ip: '203.0.113.55', location: 'Tokyo, JP', status: 'error', details: 'Session sid_t6u7v8 failed: expired callback token' },
  { id: 'e26', timestamp: '2026-04-08T09:15:00Z', tenantId: 't5', tenantName: 'CloudBank Finance', eventType: 'login', ip: '44.192.55.10', location: 'New York, US', status: 'success', details: 'Admin login: security@cloudbank.finance' },
  { id: 'e27', timestamp: '2026-04-08T08:00:00Z', tenantId: 't1', tenantName: 'Acme Corp', eventType: 'session_created', ip: '52.14.88.201', location: 'Columbus, US', status: 'info', details: 'New session sid_w9x0y1 initiated' },
  { id: 'e28', timestamp: '2026-04-07T23:45:00Z', tenantId: 't2', tenantName: 'Northwind Traders', eventType: 'session_verified', ip: '34.245.12.99', location: 'London, GB', status: 'success', details: 'Session sid_z2a3b4 verified successfully' },
  { id: 'e29', timestamp: '2026-04-07T09:44:00Z', tenantId: 't5', tenantName: 'CloudBank Finance', eventType: 'ip_banned', ip: '198.51.100.7', location: 'Unknown', status: 'error', details: 'IP permanently banned: suspicious callback replay attack' },
  { id: 'e30', timestamp: '2026-04-07T08:12:00Z', tenantId: 't3', tenantName: 'TechStartup.dev', eventType: 'session_created', ip: '91.108.12.34', location: 'Berlin, DE', status: 'info', details: 'New session sid_c5d6e7 initiated' },
];

// ─── Dashboard stats ───

export const platformStats = {
  totalSites: mockTenants.length,
  totalSessionsToday: 1847,
  totalActiveUsers: 312,
  platformSuccessRate: 96.2,
  systemHealth: 'operational' as const,
};
