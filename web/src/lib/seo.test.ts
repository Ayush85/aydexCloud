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
    expect(urls.join(' ')).not.toMatch(/dashboard|\/api\/|share/)
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
    expect(t).not.toMatch(/dashboard|\/api\//)
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
