import { describe, it, expect } from 'vitest'
import { COMPARISONS } from './comparisons'
import { FAQS } from './faq'
import sitemap from '../app/sitemap'
import robots from '../app/robots'

describe('seo', () => {
  it('comparison slugs are unique and url-safe', () => {
    const slugs = COMPARISONS.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    slugs.forEach((s) => expect(s).toMatch(/^[a-z0-9-]+$/))
  })

  it('titles and descriptions fit search-result limits', () => {
    for (const c of COMPARISONS) {
      expect(c.title.length).toBeLessThanOrEqual(75)
      expect(c.description.length).toBeGreaterThan(80)
      expect(c.description.length).toBeLessThanOrEqual(200)
      expect(c.rows.length).toBeGreaterThanOrEqual(5)
      expect(c.sources.length).toBeGreaterThan(0)
    }
  })

  it('every FAQ has a question and a non-trivial answer', () => {
    for (const f of FAQS) {
      expect(f.q.endsWith('?')).toBe(true)
      expect(f.a.length).toBeGreaterThan(40)
    }
  })

  it('sitemap lists the landing page and every comparison, but not private areas', () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls.some((u) => u.endsWith('/'))).toBe(true)
    COMPARISONS.forEach((c) => expect(urls.some((u) => u.endsWith(`/vs/${c.slug}`))).toBe(true))
    // Private areas only: match them as path segments (docs pages may legitimately mention the word "dashboard").
    expect(urls.filter((u) => /^\/(dashboard|api|share)(\/|$)/.test(new URL(u).pathname))).toEqual([])
  })

  it('robots blocks private areas and points at the sitemap', () => {
    const r = robots()
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules
    expect(rule.disallow).toEqual(expect.arrayContaining(['/dashboard', '/api/']))
    expect(r.sitemap).toMatch(/sitemap\.xml$/)
  })
})

import { llmsTxt, llmsFullTxt } from './llms'
import { PLANS } from './plans'

describe('geo / llms.txt', () => {
  it('llms.txt is valid llms-style markdown linking the key pages', () => {
    const t = llmsTxt()
    expect(t.startsWith('# aydex.cloud\n')).toBe(true)
    expect(t).toMatch(/^> .+/m)
    expect(t).toContain('/about')
    COMPARISONS.forEach((c) => expect(t).toContain(`/vs/${c.slug}`))
    const linked = Array.from(t.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)).map((m) => new URL(m[1]).pathname)
    expect(linked.filter((p) => /^\/(dashboard|api|share)(\/|$)/.test(p))).toEqual([])
  })

  it('llms-full.txt carries current pricing, all FAQs and comparisons', () => {
    const t = llmsFullTxt()
    Object.values(PLANS).forEach((p) => expect(t).toContain(`| ${p.label} |`))
    FAQS.forEach((f) => expect(t).toContain(f.q))
    COMPARISONS.forEach((c) => expect(t).toContain(`vs ${c.name}`))
  })

  it('robots explicitly allows AI crawlers and still blocks private areas for them', () => {
    const rules = robots().rules as { userAgent: string | string[]; allow?: string; disallow?: string[] }[]
    const ai = rules.find((r) => Array.isArray(r.userAgent))!
    expect(ai.userAgent).toEqual(expect.arrayContaining(['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended']))
    expect(ai.disallow).toEqual(expect.arrayContaining(['/dashboard', '/api/']))
  })
})

import { GUIDES } from './guides'
describe('guides', () => {
  it('have unique slugs, sane meta lengths, FAQs, and appear in sitemap + llms', () => {
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length)
    const urls = sitemap().map((e) => e.url)
    for (const g of GUIDES) {
      expect(g.title.length).toBeLessThanOrEqual(100)
      expect(g.description.length).toBeGreaterThan(80)
      expect(g.description.length).toBeLessThanOrEqual(220)
      expect(g.faqs.length).toBeGreaterThan(0)
      expect(urls.some((u) => u.endsWith(`/guides/${g.slug}`))).toBe(true)
      expect(llmsTxt()).toContain(`/guides/${g.slug}`)
    }
  })
})

describe('user guide', () => {
  it('has unique slugs, content on every page, and valid table rows', async () => {
    const { DOCS, DOC_GROUPS } = await import('./docs')
    expect(new Set(DOCS.map((d) => d.slug)).size).toBe(DOCS.length)
    for (const d of DOCS) {
      expect(DOC_GROUPS).toContain(d.group)
      expect(d.title.length).toBeGreaterThan(3)
      expect(d.description.length).toBeGreaterThan(30)
      expect(d.blocks.length).toBeGreaterThan(0)
      for (const b of d.blocks) if (b.t === 'table') for (const r of b.rows) expect(r.length).toBe(b.head.length)
    }
  })
  it('plans table matches PLANS and llms.txt lists the docs', async () => {
    const { DOCS } = await import('./docs')
    const { PLANS } = await import('./plans')
    const plans = DOCS.find((d) => d.slug === 'plans-and-limits')!.blocks.find((b) => b.t === 'table') as { rows: string[][] }
    expect(plans.rows.map((r) => r[0])).toEqual(Object.values(PLANS).map((p) => p.label))
    const { llmsTxt } = await import('./llms')
    expect(llmsTxt()).toContain('/docs/getting-started')
  })
})
