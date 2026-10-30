import dns from 'dns'
import https from 'https'
import net from 'net'

/** True for loopback, private, link-local, CGNAT, multicast, reserved and cloud-metadata addresses. */
export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19))
    )
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase()
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(l)
    if (mapped) return isBlockedIp(mapped[1])
    return l === '::' || l === '::1' || l.startsWith('fe8') || l.startsWith('fe9') || l.startsWith('fea') || l.startsWith('feb') ||
      l.startsWith('fc') || l.startsWith('fd') || l.startsWith('ff') || l.startsWith('64:ff9b')
  }
  return true // not an IP at all
}

/** dns.lookup replacement that refuses to resolve to a blocked address. Validating here, at connect time,
 *  also defeats DNS-rebinding (the checked address is the one actually connected to). */
const safeLookup: net.LookupFunction = (hostname, options, cb) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addrs) => {
    if (err) return cb(err, '', 4)
    const list = (addrs as dns.LookupAddress[]) ?? []
    const ok = list.filter((a) => !isBlockedIp(a.address))
    if (!ok.length || ok.length !== list.length) return cb(new Error('blocked address'), '', 4)
    if ((options as { all?: boolean }).all) return (cb as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, ok)
    cb(null, ok[0].address, ok[0].family)
  })
}

export interface SafeFetchResult { ok: boolean; status: number; body: string; error?: string }

/** GET an https URL with SSRF protection: public addresses only, no credentials/ports, redirects re-checked,
 *  5s timeout, body capped at 512 KB. */
export async function safeGetHtml(startUrl: string, maxRedirects = 3): Promise<SafeFetchResult> {
  let url = startUrl
  for (let hop = 0; hop <= maxRedirects; hop++) {
    let u: URL
    try { u = new URL(url) } catch { return { ok: false, status: 0, body: '', error: 'invalid url' } }
    if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) {
      return { ok: false, status: 0, body: '', error: 'only plain https URLs are checked' }
    }
    if (net.isIP(u.hostname.replace(/^\[|\]$/g, '')) ) return { ok: false, status: 0, body: '', error: 'IP addresses are not allowed' }

    const res = await new Promise<{ status: number; location?: string; body: string } | { error: string }>((resolve) => {
      const req = https.get(u, { lookup: safeLookup, timeout: 5000, headers: { 'User-Agent': 'aydex-install-check/1.0', Accept: 'text/html' } }, (r) => {
        const chunks: Buffer[] = []
        let size = 0
        r.on('data', (c: Buffer) => {
          size += c.length
          if (size > 512 * 1024) { r.destroy(); resolve({ status: r.statusCode ?? 0, location: r.headers.location, body: Buffer.concat(chunks).toString('utf8') }); return }
          chunks.push(c)
        })
        r.on('end', () => resolve({ status: r.statusCode ?? 0, location: r.headers.location, body: Buffer.concat(chunks).toString('utf8') }))
        r.on('error', () => resolve({ error: 'connection error' }))
      })
      req.on('timeout', () => { req.destroy(); resolve({ error: 'timed out' }) })
      req.on('error', (e) => resolve({ error: /blocked address/.test(e.message) ? 'blocked address' : 'could not connect' }))
    })
    if ('error' in res) return { ok: false, status: 0, body: '', error: res.error }
    if (res.status >= 300 && res.status < 400 && res.location) {
      url = new URL(res.location, u).toString()
      continue
    }
    return { ok: res.status >= 200 && res.status < 300, status: res.status, body: res.body }
  }
  return { ok: false, status: 0, body: '', error: 'too many redirects' }
}

/** Looks for the aydex script tag for this tracking id in a page's HTML. */
export function findInstall(html: string, trackingId: string): { found: boolean; wrongId?: string } {
  const tags = html.match(/<script\b[^>]*>/gi) ?? []
  let other: string | undefined
  for (const t of tags) {
    if (!/script\.js|\/s\.js/i.test(t) && !/data-site/i.test(t)) continue
    const id = /data-site\s*=\s*["']?([A-Za-z0-9_-]+)/i.exec(t)?.[1]
    if (!id) continue
    if (id === trackingId) return { found: true }
    other = id
  }
  return { found: false, wrongId: other }
}
