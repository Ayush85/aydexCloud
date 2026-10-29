import { describe, it, expect } from 'vitest'
import { buildUtmUrl } from './utm'
import { badgeSvg } from './badge'

describe('buildUtmUrl', () => {
  it('adds tags, normalises case/spaces and adds https', () => {
    const r = buildUtmUrl({ url: 'example.com/pricing', source: 'Newsletter', medium: 'Email', campaign: 'Black Friday' })
    expect(r).toEqual({ ok: true, url: 'https://example.com/pricing?utm_source=newsletter&utm_medium=email&utm_campaign=black_friday' })
  })
  it('keeps existing params and hash, replaces old utm_*', () => {
    const r = buildUtmUrl({ url: 'https://a.com/p?x=1&utm_source=old#top', source: 's', medium: 'm', campaign: 'c', term: 'T' })
    expect(r.ok && r.url).toBe('https://a.com/p?x=1&utm_source=s&utm_medium=m&utm_campaign=c&utm_term=t#top')
  })
  it('rejects bad input', () => {
    for (const x of [{ url: '' }, { url: 'localhost' }, { url: 'javascript://x.y' }, { url: 'a.com', source: '', medium: 'm', campaign: 'c' }]) {
      expect(buildUtmUrl({ source: 's', medium: 'm', campaign: 'c', ...x }).ok).toBe(false)
    }
  })
})

describe('badgeSvg', () => {
  it('renders a number, formats thousands, and n/a for null', () => {
    expect(badgeSvg(12345)).toContain('12,345')
    expect(badgeSvg(null)).toContain('n/a')
    expect(badgeSvg(-5)).toContain('>0<')
  })
})
