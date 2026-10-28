import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AydexClient } from './api.js'

const sites = [
  { id: 's1', name: 'Blog', domain: 'blog.example.com' },
  { id: 's2', name: 'Shop', domain: 'shop.example.com' },
]
function fake(routes) {
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url, auth: init.headers.Authorization })
    const path = url.replace('https://aydex.test', '')
    const hit = routes[path]
    if (!hit) return { ok: false, status: 404, json: async () => ({ error: 'nope' }) }
    return { ok: true, status: 200, json: async () => hit }
  }
  return { fetchImpl, calls }
}

test('requires an API key', () => {
  assert.throws(() => new AydexClient({ apiKey: '' }), /AYDEX_API_KEY/)
})

test('resolves a site by domain, name, id and fragment; errors clearly otherwise', async () => {
  const { fetchImpl } = fake({ '/api/v1/sites': { sites } })
  const c = new AydexClient({ apiKey: 'k', baseUrl: 'https://aydex.test/', fetchImpl })
  assert.equal((await c.resolveSite('shop.example.com')).id, 's2')
  assert.equal((await c.resolveSite('BLOG')).id, 's1')
  assert.equal((await c.resolveSite('s2')).id, 's2')
  assert.equal((await c.resolveSite('shop')).id, 's2')
  await assert.rejects(() => c.resolveSite(), /specify one of/)
  await assert.rejects(() => c.resolveSite('zzz'), /No site matches/)
})

test('report calls the right URL with bearer auth', async () => {
  const { fetchImpl, calls } = fake({
    '/api/v1/sites': { sites: [sites[0]] },
    '/api/v1/sites/s1/insights?period=30d': { report: 'insights', data: [{ text: 'hi' }] },
  })
  const c = new AydexClient({ apiKey: 'ax_live_x', baseUrl: 'https://aydex.test', fetchImpl })
  const r = await c.report(undefined, 'insights', '30d')
  assert.equal(r.data[0].text, 'hi')
  assert.ok(calls.every((x) => x.auth === 'Bearer ax_live_x'))
})

test('surfaces API errors', async () => {
  const { fetchImpl } = fake({})
  const c = new AydexClient({ apiKey: 'k', baseUrl: 'https://aydex.test', fetchImpl })
  await assert.rejects(() => c.listSites(), /nope/)
})
