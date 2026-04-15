import { useEffect, useMemo, useState } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  type QuerySnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firestore';
import { ScrollText, Filter, ShieldCheck, Ban, Loader2 } from 'lucide-react';

/**
 * Consent record shape — written by the phone (FirebaseService.writeConsentRecord)
 * on first-time pairing accept. Records are immutable except for revoked_at,
 * which the phone stamps when the user removes the site from their Sites list.
 *
 * Mirrored on the WP side as wp_flashid_consent_log table rows.
 */
interface ConsentRecord {
  id: string;
  uid: string;
  siteUrl: string;
  siteName: string;
  consentedAt: string;        // ISO timestamp
  consentVersion: number;
  dataCategories: string[];
  biometricLocality: string;  // 'on_device_only'
  appVersion: string;
  deviceModel: string;
  sessionId: string;
  revokedAt?: string;
}

type StatusFilter = 'all' | 'active' | 'revoked';

/**
 * Superadmin-scoped Consent Log viewer. Shows ALL consent records across
 * all users so platform compliance can audit who consented to what, when,
 * under which disclosure version. Records are never deleted — revocations
 * are stamped via revokedAt so the audit trail stays intact.
 *
 * No write actions here — this is a read-only audit view. The phone is
 * the only writer for both the consent grant and the revocation.
 */
export default function ConsentLog() {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [uidFilter, setUidFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [versionFilter, setVersionFilter] = useState<string>('all');

  useEffect(() => {
    // Live listener — new consents/revocations appear without refresh.
    // Ordered server-side; client filters apply on top of the snapshot.
    const q = query(
      collection(db, 'consent_records'),
      orderBy('consentedAt', 'desc'),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const next = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: String(data.uid ?? ''),
            siteUrl: String(data.siteUrl ?? ''),
            siteName: String(data.siteName ?? ''),
            consentedAt: String(data.consentedAt ?? ''),
            consentVersion: Number(data.consentVersion ?? 1),
            dataCategories: Array.isArray(data.dataCategories) ? data.dataCategories : [],
            biometricLocality: String(data.biometricLocality ?? 'on_device_only'),
            appVersion: String(data.appVersion ?? ''),
            deviceModel: String(data.deviceModel ?? ''),
            sessionId: String(data.sessionId ?? ''),
            revokedAt: data.revokedAt ? String(data.revokedAt) : undefined,
          } as ConsentRecord;
        });
        setRecords(next);
        setLoading(false);
      },
      (err) => {
        console.error('consent_records snapshot error:', err);
        setError(err.message || 'Failed to load consent records.');
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const versions = useMemo(() => {
    const seen = new Set<number>();
    records.forEach((r) => seen.add(r.consentVersion));
    return Array.from(seen).sort((a, b) => a - b);
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (uidFilter && !r.uid.toLowerCase().includes(uidFilter.toLowerCase())) return false;
      if (siteFilter && !r.siteUrl.toLowerCase().includes(siteFilter.toLowerCase())
          && !r.siteName.toLowerCase().includes(siteFilter.toLowerCase())) return false;
      if (statusFilter === 'active' && r.revokedAt) return false;
      if (statusFilter === 'revoked' && !r.revokedAt) return false;
      if (versionFilter !== 'all' && String(r.consentVersion) !== versionFilter) return false;
      return true;
    });
  }, [records, uidFilter, siteFilter, statusFilter, versionFilter]);

  const activeCount = filtered.filter((r) => !r.revokedAt).length;
  const revokedCount = filtered.length - activeCount;

  const clearFilters = () => {
    setUidFilter('');
    setSiteFilter('');
    setStatusFilter('all');
    setVersionFilter('all');
  };
  const hasFilters = uidFilter || siteFilter || statusFilter !== 'all' || versionFilter !== 'all';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-blue-600" />
            Consent Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable audit trail of first-time site authorizations across the platform.
            Records are never deleted — revoking a site stamps the revoke timestamp so the
            compliance history stays intact.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium">
            {activeCount} active
          </div>
          <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
            {revokedCount} revoked
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4" /> Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={uidFilter}
            onChange={(e) => setUidFilter(e.target.value)}
            placeholder="Firebase UID..."
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
          <input
            type="text"
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            placeholder="Site (URL or name)..."
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="revoked">Revoked only</option>
          </select>
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="all">All versions</option>
            {versions.map((v) => <option key={v} value={String(v)}>v{v}</option>)}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          {hasFilters ? 'No records match the current filters.' : 'No consent records yet.'}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Flash ID</th>
                  <th className="px-4 py-3 text-left">Site</th>
                  <th className="px-4 py-3 text-left">Consented</th>
                  <th className="px-4 py-3 text-left">Version</th>
                  <th className="px-4 py-3 text-left">Data Shared</th>
                  <th className="px-4 py-3 text-left">App / Device</th>
                  <th className="px-4 py-3 text-left">Revoked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3">
                      {r.revokedAt ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <Ban className="w-3.5 h-3.5" /> Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                          <ShieldCheck className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {r.uid.length > 16 ? r.uid.slice(0, 12) + '…' : r.uid}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{r.siteName || hostnameOf(r.siteUrl)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">{r.siteUrl}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {fmtDate(r.consentedAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">v{r.consentVersion}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                      {r.dataCategories.length ? r.dataCategories.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                      {r.appVersion || '—'}
                      {r.deviceModel && <div className="text-slate-400 dark:text-slate-500">{r.deviceModel}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {r.revokedAt ? fmtDate(r.revokedAt) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
