# TODO — superuserweb-flashid

## 🔴 SECURITY AUDIT — 2026-04-15 (localStorage authorization bypass)

**Audit scope:** all 3 React portals (`web-flashid`, `adminweb-flashid`,
`superuserweb-flashid`). This entry is the canonical record; the other two
portals' TODO.md files reference back here.

### Severity 1 — CRITICAL: client-side auth token

`{prefix}-qr-verified-at` (localStorage) is the SOLE evidence the portal
checks to decide whether the user is QR-verified. An attacker with browser
access can set a future timestamp in DevTools and skip QR verification
entirely on the next page load.

```
localStorage.setItem('superadmin-qr-verified-at', String(Date.now() + 86400000))
// → "verified" for the next 24 hours, no biometrics, no challenge
```

Affected reads/writes:
- `web-flashid/src/App.tsx` — lines 180, 1160
- `adminweb-flashid/src/App.tsx` — lines 32, 120
- `superuserweb-flashid/src/App.tsx` — lines 34, 178

**Fix:** Replace with a server-issued claim. Cloud Function writes
`/users/{uid}/authState` doc `{lastQrVerifiedAt, expiresAt}` after the phone
approves a session. Firestore rules deny client writes. Client reads only.

- [ ] **SEC-1.1**: Cloud Function `markSessionVerified` (server-side write)
- [ ] **SEC-1.2**: Firestore rules — deny client writes to `/users/{uid}/authState`
- [ ] **SEC-1.3**: Replace localStorage check in App.tsx with Firestore listener (× 3 portals)
- [ ] **SEC-1.4**: Remove all `setItem('{prefix}-qr-verified-at', ...)` call sites (× 3)

### Severity 2 — HIGH: client-authored biometric/challenge requirements

When the portal generates a QR session, it reads
`{prefix}-require-face|fingerprint|voice` and `{prefix}-verification-methods`
**from localStorage** and bakes them into the QR URL + Firestore session doc.
Phone trusts whatever it sees. Attacker zeros them out → next session has no
biometric and no challenge requirement; phone accepts the downgrade silently.

Affected:
- `*/src/lib/sessions.ts` createSession() — reads from caller, writes to
  `auth_sessions/{sid}` and the QR `flashid://auth?...&v=&k=&w=&m=` URL
- `*/src/components/QRVerification.tsx` — passes localStorage values to createSession
- `*/src/pages/Settings.tsx` — toggles write to localStorage (× 2 portals; web has it inline in App.tsx)

The phone (and any server-side rule) has no authoritative source of what
was configured by the legitimate admin.

**Fix:** Move admin biometric/challenge config to Firestore
`/admin_profiles/{uid}` (rules: only that admin writes, only via Cloud
Function with role validation). Session creation becomes a Cloud Function
that reads admin_profiles server-side and writes the authoritative session
doc. Phone reads `auth_sessions/{sid}` directly — stop trusting QR URL
`v/k/w/m` query params.

- [ ] **SEC-2.1**: Schema `/admin_profiles/{uid}` — `{requireFace, requireFingerprint, requireVoice, enabledMethods, securityLevel, sessionTimeout}`
- [ ] **SEC-2.2**: Cloud Function `createAuthSession(callerUid, siteUrl, siteName)` — reads admin_profiles, writes auth_sessions
- [ ] **SEC-2.3**: Firestore rules — deny direct client `setDoc` on `auth_sessions/*`; allow client read on `admin_profiles/{uid}` only for that uid
- [ ] **SEC-2.4**: Portals — Settings UI writes via Cloud Function, not localStorage (× 3)
- [ ] **SEC-2.5**: Portals — QRVerification calls `createAuthSession` Cloud Function instead of client-side createSession (× 3)
- [ ] **SEC-2.6**: Phone — read `auth_sessions/{sid}` doc as sole source of truth for required biometrics + challenge. Ignore QR URL `v/k/w/m` (or remove from URL entirely).
- [ ] **SEC-2.7**: localStorage `{prefix}-require-*` and `{prefix}-verification-methods` become UI-only caches (no auth authority)

### Severity 2 — HIGH: `{prefix}-security-level`

Controls whether the portal re-challenges on refresh. Flip to `'secure'` →
no re-verification. Same fix as SEC-2 (move to admin_profiles).

- [ ] **SEC-3.1**: Move `security-level` and `session-timeout` to `/admin_profiles/{uid}` (covered by SEC-2.1)

### Severity 3 — Phone trusts QR URL params

Phone currently reads `&v=&k=&w=&m=` from the QR deep-link to determine
required biometrics. Stop trusting these. After SEC-2 lands, phone reads
the Firestore session doc only.

- [ ] **SEC-4.1**: Phone — replace QR-URL biometric flag parsing with Firestore session doc read
- [ ] **SEC-4.2**: Optional — remove `v/k/w/m` from QR URL entirely (advisory display only)

### Severity 5 — Bad integrator example in Docs.tsx

`adminweb-flashid/src/pages/Docs.tsx:275` shows `localStorage.setItem('auth_token', ...)`
as an integrator code sample. Bad guidance to publish. Rewrite to use
httpOnly cookie or in-memory token.

- [ ] **SEC-5.1**: Rewrite Docs.tsx auth_token sample (httpOnly cookie pattern)

### Severity 6 — Cleanup

- [ ] **SEC-6.1**: Fix mismatched default `'90'` for `admin-session-timeout` in `adminweb-flashid/src/App.tsx:34` (should be `'4h'` to match other portals)
- [ ] **SEC-6.2**: Gate `localStorage.clear()` debug paths behind dev-only checks (`web-flashid/src/main.tsx:15`, `App.tsx:143`)

### Audit summary table

| Key | Severity | Risk | Fix area |
|---|---|---|---|
| `{prefix}-qr-verified-at` | **SEV 1** | Client-side auth bypass | SEC-1 |
| `{prefix}-require-face/fingerprint/voice` | **SEV 2** | Biometric requirement bypass | SEC-2 |
| `{prefix}-verification-methods` | **SEV 2** | Challenge bypass | SEC-2 |
| `{prefix}-security-level` | **SEV 2** | Disable re-verify | SEC-3 |
| `{prefix}-session-timeout` | SEV 2 (low) | Extend session | SEC-3 |
| `{prefix}-qr-timeout` | preference | Long-lived QR (own machine only) | — |
| `{prefix}-theme` | preference | safe | — |
| `auth_token` example in Docs | SEV 5 | Bad public guidance | SEC-5 |

## Phase 5 Dashboards
- [ ] **F1**: Connect to real Firebase/api-flashid (replace mock data)

## Phase 9 — FIDO2 Implementation (Future)
- No changes needed — FIDO2 is handled by app and site-level components

## Phase 10 — Adaptive Authentication (Future)
- [ ] **AA16**: Platform-wide risk monitoring dashboard
- [ ] **AA17**: Cross-tenant threat correlation
