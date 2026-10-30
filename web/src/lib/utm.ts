export interface UtmInput { url: string; source: string; medium: string; campaign: string; term?: string; content?: string }

/** Builds a tagged URL. Returns an error string for unusable input. Existing query/hash are kept; existing utm_* are replaced. */
export function buildUtmUrl(i: UtmInput): { ok: true; url: string } | { ok: false; error: string } {
  let raw = i.url.trim()
  if (!raw) return { ok: false, error: 'Enter the page URL.' }
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`
  let u: URL
  try { u = new URL(raw) } catch { return { ok: false, error: 'That does not look like a valid URL.' } }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { ok: false, error: 'Use an http or https URL.' }
  if (!u.hostname.includes('.')) return { ok: false, error: 'That does not look like a valid URL.' }
  const clean = (v?: string) => (v ?? '').trim().replace(/\s+/g, '_').toLowerCase()
  const src = clean(i.source), med = clean(i.medium), cam = clean(i.campaign)
  if (!src || !med || !cam) return { ok: false, error: 'Source, medium and campaign are required.' }
  for (const k of Array.from(u.searchParams.keys())) if (k.startsWith('utm_')) u.searchParams.delete(k)
  u.searchParams.set('utm_source', src)
  u.searchParams.set('utm_medium', med)
  u.searchParams.set('utm_campaign', cam)
  if (clean(i.term)) u.searchParams.set('utm_term', clean(i.term))
  if (clean(i.content)) u.searchParams.set('utm_content', clean(i.content))
  return { ok: true, url: u.toString() }
}
