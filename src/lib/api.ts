// ─── Tenant / Site data ───

export interface Tenant {
  id: string;
  siteName: string;
  url: string;
  ownerEmail: string;
  apiKey: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended';
  createdAt: string;
  sessionCount: number;
  successRate: number;
  lastActivity: string;
}

export const mockTenants: Tenant[] = [
  {
    id: 't1',
    siteName: 'Acme Corp',
    url: 'https://acme-corp.com',
    ownerEmail: 'admin@acme-corp.com',
    apiKey: 'fid_live_ak8Xj29mPqR4sT7vWzYb',
    plan: 'enterprise',
    status: 'active',
    createdAt: '2025-08-14T10:30:00Z',
    sessionCount: 14832,
    successRate: 97.3,
    lastActivity: '2026-04-09T08:12:44Z',
  },
  {
    id: 't2',
    siteName: 'Northwind Traders',
    url: 'https://northwind-traders.io',
    ownerEmail: 'tech@northwind-traders.io',
    apiKey: 'fid_live_pL3nO8kQwE6rT1yU5iAd',
    plan: 'pro',
    status: 'active',
    createdAt: '2025-11-02T14:15:00Z',
    sessionCount: 6421,
    successRate: 94.8,
    lastActivity: '2026-04-09T07:55:19Z',
  },
  {
    id: 't3',
    siteName: 'TechStartup.dev',
    url: 'https://techstartup.dev',
    ownerEmail: 'founder@techstartup.dev',
    apiKey: 'fid_live_mN7bV2cX9dF4gH1jK6sL',
    plan: 'starter',
    status: 'active',
    createdAt: '2026-01-20T09:45:00Z',
    sessionCount: 1203,
    successRate: 91.5,
    lastActivity: '2026-04-08T22:31:07Z',
  },
  {
    id: 't4',
    siteName: 'BadActor Shop',
    url: 'https://badactor-shop.xyz',
    ownerEmail: 'contact@badactor-shop.xyz',
    apiKey: 'fid_live_zQ5wE8rT3yU7iO2pA9sD',
    plan: 'free',
    status: 'suspended',
    createdAt: '2026-02-11T16:20:00Z',
    sessionCount: 87,
    successRate: 12.4,
    lastActivity: '2026-03-15T04:18:33Z',
  },
  {
    id: 't5',
    siteName: 'CloudBank Finance',
    url: 'https://cloudbank.finance',
    ownerEmail: 'security@cloudbank.finance',
    apiKey: 'fid_live_hG4fD7sA1kL6jM3nB8vC',
    plan: 'enterprise',
    status: 'active',
    createdAt: '2025-09-30T11:00:00Z',
    sessionCount: 28451,
    successRate: 99.1,
    lastActivity: '2026-04-09T08:14:02Z',
  },
  {
    id: 't6',
    siteName: 'PixelArt Studio',
    url: 'https://pixelart.studio',
    ownerEmail: 'hello@pixelart.studio',
    apiKey: 'fid_live_tY2uI5oP8aS1dF4gH7jK',
    plan: 'starter',
    status: 'active',
    createdAt: '2026-03-05T13:10:00Z',
    sessionCount: 342,
    successRate: 88.7,
    lastActivity: '2026-04-09T06:42:18Z',
  },
];

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
