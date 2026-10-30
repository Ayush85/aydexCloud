import { describe, it, expect } from 'vitest'
import { isBlockedIp, findInstall, safeGetHtml } from './ssrf'

describe('isBlockedIp', () => {
  it('blocks private, loopback, link-local, metadata, CGNAT, mapped and non-IPs', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '::1', '::', 'fe80::1', 'fd00::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1', 'localhost']) {
      expect(isBlockedIp(ip), ip).toBe(true)
    }
  })
  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '2606:4700:4700::1111']) expect(isBlockedIp(ip), ip).toBe(false)
  })
})

describe('findInstall', () => {
  it('finds the matching tracking id in any attribute order', () => {
    expect(findInstall('<script defer data-site="abc123" src="https://t.x.com/script.js"></script>', 'abc123').found).toBe(true)
    expect(findInstall("<script src='/stats/s.js' data-site='abc123' defer>", 'abc123').found).toBe(true)
  })
  it('reports a different id, and missing script', () => {
    expect(findInstall('<script data-site="zzz" src="/script.js"></script>', 'abc123')).toEqual({ found: false, wrongId: 'zzz' })
    expect(findInstall('<html>abc123</html>', 'abc123').found).toBe(false)
  })
})

describe('safeGetHtml refuses before connecting', () => {
  it('rejects http, credentials, ports, and IP literals', async () => {
    for (const u of ['http://example.com/', 'https://u:p@example.com/', 'https://example.com:8443/', 'https://127.0.0.1/', 'https://[::1]/', 'not a url']) {
      const r = await safeGetHtml(u)
      expect(r.ok, u).toBe(false)
    }
  })
  it('refuses localhost by name (resolves to loopback)', async () => {
    const r = await safeGetHtml('https://localhost/')
    expect(r.ok).toBe(false)
  })
})
