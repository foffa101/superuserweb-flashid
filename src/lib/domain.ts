/**
 * Normalize a user-supplied domain string to the bare host form used everywhere
 * in Firestore: no scheme, no www, no trailing slash, lowercased.
 *
 *   "https://www.example.com/"  →  "example.com"
 *   "WWW.Foo.co.uk"             →  "foo.co.uk"
 *   "  example.com/wp "         →  "example.com/wp"   (path preserved for now)
 *
 * Keep the logic trivial on purpose — matching across repos is string-equality,
 * so any surprise transformation here would break existing records.
 */
export function normalizeDomain(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

export function normalizeDomainList(list: readonly string[] | undefined): string[] {
  if (!list) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const d of list) {
    const n = normalizeDomain(d);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}
