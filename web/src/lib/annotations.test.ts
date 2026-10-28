import { describe, it, expect } from 'vitest'
import { parseAnnotation, annotationInsights } from './annotations'

const today = new Date('2026-10-28T10:00:00Z')

describe('parseAnnotation', () => {
  it('accepts a valid note and trims it', () => {
    expect(parseAnnotation({ date: '2026-10-20', text: '  Launched on Product Hunt ' }, today)).toEqual({ ok: true, date: '2026-10-20', text: 'Launched on Product Hunt' })
  })
  it('rejects empty, long, malformed, impossible, future and ancient input', () => {
    const bad = (x: unknown) => expect(parseAnnotation(x, today).ok).toBe(false)
    bad(null)
    bad({ date: '2026-10-20', text: '   ' })
    bad({ date: '2026-10-20', text: 'x'.repeat(141) })
    bad({ date: '20/10/2026', text: 'a' })
    bad({ date: '2026-02-30', text: 'a' })
    bad({ date: '2026-12-01', text: 'a' })
    bad({ date: '1999-01-01', text: 'a' })
    bad({ date: 5, text: 'a' })
  })
})

describe('annotationInsights', () => {
  it('turns notes into at most two neutral insights', () => {
    const r = annotationInsights([{ date: '2026-10-01', text: 'a' }, { date: '2026-10-02', text: 'b' }, { date: '2026-10-03', text: 'c' }])
    expect(r).toHaveLength(2)
    expect(r[0].text).toBe('Your note on 2026-10-01: “a” falls in this period.')
  })
})
