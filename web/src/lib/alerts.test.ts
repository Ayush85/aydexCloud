import { describe, it, expect } from 'vitest'
import { detectAlert, alertText } from './alerts'
import { webhookKind, maskWebhook, postWebhook } from './webhook'

const steady = [100, 98, 102, 101, 99, 100, 103, 97, 100, 101, 99, 100, 102, 100]

describe('detectAlert', () => {
  it('is quiet on normal days and on tiny sites', () => {
    expect(detectAlert([...steady, 104])).toBeNull()
    expect(detectAlert([...steady, 70])).toBeNull() // -30%: not enough
    expect(detectAlert([3, 2, 4, 3, 2, 3, 4, 3, 0])).toBeNull() // baseline too low to judge
    expect(detectAlert([100, 100, 100])).toBeNull() // not enough history
  })
  it('detects a drop, a spike and a dead tracker', () => {
    expect(detectAlert([...steady, 30])?.kind).toBe('drop')
    expect(detectAlert([...steady, 260])?.kind).toBe('spike')
    expect(detectAlert([...steady, 0])?.kind).toBe('no-data')
  })
  it('writes readable messages', () => {
    const a = detectAlert([...steady, 30])!
    const t = alertText('Shop', a, 'https://x/d')
    expect(t.subject).toBe('Shop: traffic dropped yesterday')
    expect(t.body).toMatch(/−70% vs the usual 100\/day/)
    expect(alertText('Shop', detectAlert([...steady, 0])!, 'u').body).toMatch(/tracking script/)
  })
})

describe('webhooks', () => {
  const slack = 'https://hooks.slack.com/services/T000/B000/XXXXXXXXXXXXXXXX'
  const discord = 'https://discord.com/api/webhooks/123456789/abc-DEF_ghi'
  it('accepts only Slack and Discord incoming-webhook URLs', () => {
    expect(webhookKind(slack)).toBe('slack')
    expect(webhookKind(discord)).toBe('discord')
    for (const bad of [
      'http://hooks.slack.com/services/T/B/X',
      'https://evil.com/services/T/B/X',
      'https://hooks.slack.com.evil.com/services/T/B/X',
      'https://user:pw@hooks.slack.com/services/T/B/X',
      'https://hooks.slack.com:8443/services/T/B/X',
      'https://169.254.169.254/latest/meta-data',
      'https://discord.com/api/webhooks/abc/def',
      'not a url',
    ]) expect(webhookKind(bad)).toBeNull()
  })
  it('masks the secret', () => {
    expect(maskWebhook(slack)).toBe('Slack webhook ····XXXX')
    expect(maskWebhook(slack)).not.toContain('T000')
  })
  it('posts the right payload and refuses invalid URLs without calling out', async () => {
    const calls: { url: string; body: string; redirect?: string }[] = []
    const f = (async (url: string, init: RequestInit) => {
      calls.push({ url, body: String(init.body), redirect: init.redirect })
      return { status: 200 } as Response
    }) as unknown as typeof fetch
    expect(await postWebhook(slack, 'hi', f)).toBe(true)
    expect(JSON.parse(calls[0].body)).toEqual({ text: 'hi' })
    expect(await postWebhook(discord, 'hi', f)).toBe(true)
    expect(JSON.parse(calls[1].body)).toEqual({ content: 'hi' })
    expect(calls.every((c) => c.redirect === 'manual')).toBe(true)
    expect(await postWebhook('https://evil.com/x', 'hi', f)).toBe(false)
    expect(calls).toHaveLength(2)
  })
})
