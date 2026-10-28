import { describe, it, expect } from 'vitest'
import { buildInsights, percentChange, zScore } from './insights'

const base = { periodLabel: '7 days' }

describe('insights', () => {
  it('declines to explain tiny samples', () => {
    const r = buildInsights({ ...base, curTotal: 5, prevTotal: 3, dims: {} })
    expect(r).toHaveLength(1)
    expect(r[0].kind).toBe('note')
  })

  it('names the channel that accounts for most of an increase', () => {
    const r = buildInsights({
      ...base, curTotal: 1000, prevTotal: 600,
      dims: { channel: [{ key: 'Search', cur: 600, prev: 300 }, { key: 'Direct', cur: 400, prev: 300 }] },
    })
    expect(r[0].text).toMatch(/rose 67%/)
    const d = r.find((i) => i.kind === 'driver')!
    expect(d.text).toBe('Search traffic accounts for 75% of the increase (+300 pageviews).')
    expect(d.tone).toBe('good')
  })

  it('describes drops and lost referrers', () => {
    const r = buildInsights({
      ...base, curTotal: 400, prevTotal: 800,
      dims: { referrer: [{ key: 'news.ycombinator.com', cur: 0, prev: 350 }, { key: '(direct)', cur: 400, prev: 450 }] },
    })
    expect(r[0].tone).toBe('bad')
    expect(r.some((i) => i.kind === 'lost' && i.text.includes('news.ycombinator.com'))).toBe(true)
    expect(r.some((i) => i.kind === 'driver' && /drop/.test(i.text))).toBe(true)
  })

  it('flags new referrers and AI traffic', () => {
    const r = buildInsights({
      ...base, curTotal: 500, prevTotal: 480,
      dims: {
        referrer: [{ key: 'reddit.com', cur: 60, prev: 0 }],
        channel: [{ key: 'AI assistants', cur: 12, prev: 4 }],
      },
    })
    expect(r.some((i) => i.kind === 'new' && i.text.includes('reddit.com'))).toBe(true)
    expect(r.some((i) => i.kind === 'ai' && i.text.includes('+200%'))).toBe(true)
    expect(r[0].text).toMatch(/steady/)
  })

  it('detects an anomalous yesterday', () => {
    const daily = [100, 98, 102, 101, 99, 100, 103, 97, 100, 101, 99, 100, 102, 100, 240]
    const r = buildInsights({ ...base, curTotal: 1500, prevTotal: 1400, dims: {}, daily })
    expect(r.some((i) => i.kind === 'anomaly' && /unusually high/.test(i.text))).toBe(true)
  })

  it('is quiet on normal variation', () => {
    const daily = [100, 90, 110, 95, 105, 100, 98, 102, 99, 101, 100, 97, 103, 100, 104]
    const r = buildInsights({ ...base, curTotal: 700, prevTotal: 690, dims: {}, daily })
    expect(r.some((i) => i.kind === 'anomaly')).toBe(false)
  })

  it('percentChange and zScore edge cases', () => {
    expect(percentChange(5, 0)).toBeNull()
    expect(percentChange(0, 0)).toBe(0)
    expect(percentChange(150, 100)).toBe(0.5)
    expect(zScore([1, 2], 5)).toBe(0)
  })
})
