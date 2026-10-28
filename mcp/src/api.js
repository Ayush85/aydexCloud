// Thin read-only client for the aydex.cloud public REST API.

export const REPORTS = [
  'overview', 'timeseries', 'pages', 'referrers', 'channels', 'ai-referrals', 'countries', 'devices',
  'browsers', 'campaigns', 'events', 'engagement', 'entry-exit', 'behavior', 'revenue', 'funnels', 'insights',
]
export const PERIODS = ['today', '7d', '30d', '90d']

export class AydexClient {
  constructor({ apiKey, baseUrl = 'https://aydex.cloud', fetchImpl = fetch }) {
    if (!apiKey) throw new Error('AYDEX_API_KEY is not set. Create a key in aydex.cloud under Settings → API keys.')
    this.apiKey = apiKey
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.fetch = fetchImpl
  }

  async get(path) {
    const res = await this.fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
    })
    let body = null
    try { body = await res.json() } catch { /* non-JSON error body */ }
    if (!res.ok) throw new Error(body?.error ?? `aydex API returned HTTP ${res.status}`)
    return body
  }

  async listSites() {
    return (await this.get('/api/v1/sites')).sites
  }

  /** Accepts a site id, name or domain (case-insensitive) and returns the matching site. */
  async resolveSite(ref) {
    const sites = await this.listSites()
    if (sites.length === 0) throw new Error('No sites found for this API key.')
    if (!ref) {
      if (sites.length === 1) return sites[0]
      throw new Error(`Several sites available — specify one of: ${sites.map((s) => s.domain).join(', ')}`)
    }
    const q = ref.trim().toLowerCase()
    const hit = sites.find((s) => s.id === ref || s.name.toLowerCase() === q || s.domain.toLowerCase() === q)
      ?? sites.find((s) => s.domain.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    if (!hit) throw new Error(`No site matches "${ref}". Available: ${sites.map((s) => s.domain).join(', ')}`)
    return hit
  }

  async report(siteRef, report, period = '7d') {
    const site = await this.resolveSite(siteRef)
    const out = await this.get(`/api/v1/sites/${encodeURIComponent(site.id)}/${report}?period=${encodeURIComponent(period)}`)
    return { site, ...out }
  }
}
