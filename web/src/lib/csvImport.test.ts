import { describe, it, expect } from 'vitest'
import { parseGa4Csv, normalizeDate, splitCsvLine, validateRows } from './csvImport'

const today = new Date('2026-10-28T00:00:00Z')

describe('csv import', () => {
  it('parses a GA4 export with comment header and quoted thousands', () => {
    const csv = `# ----------------------------------------
# Pages and screens
# Start date: 20240101
# ----------------------------------------
Date,Views,Total users,Sessions
20240101,"1,234",800,900
20240102,500,300,350
`
    const r = parseGa4Csv(csv, today)
    expect(r.error).toBeUndefined()
    expect(r.rows).toEqual([
      { date: '2024-01-01', pageviews: 1234, visitors: 800, sessions: 900 },
      { date: '2024-01-02', pageviews: 500, visitors: 300, sessions: 350 },
    ])
  })

  it('sums duplicate days and warns', () => {
    const r = parseGa4Csv('Date,Views,Users\n2024-03-01,10,5\n2024-03-01,20,7\n', today)
    expect(r.rows).toEqual([{ date: '2024-03-01', pageviews: 30, visitors: 12, sessions: 0 }])
    expect(r.warnings.join(' ')).toMatch(/more than once/)
  })

  it('skips bad and future rows with a warning', () => {
    const r = parseGa4Csv('Date,Views,Users\nnot-a-date,1,1\n29990101,1,1\n20240101,4,2\n', today)
    expect(r.rows).toHaveLength(1)
    expect(r.warnings.join(' ')).toMatch(/2 row/)
  })

  it('explains missing columns', () => {
    expect(parseGa4Csv('Foo,Bar\n1,2\n', today).error).toMatch(/Date column/)
    expect(parseGa4Csv('Date,Foo\n20240101,2\n', today).error).toMatch(/Views and\/or Users/)
    expect(parseGa4Csv('', today).error).toMatch(/no data/)
  })

  it('normalizeDate rejects impossible dates', () => {
    expect(normalizeDate('20240230')).toBeNull()
    expect(normalizeDate('2024-13-01')).toBeNull()
    expect(normalizeDate('20240229')).toBe('2024-02-29')
    expect(normalizeDate('01/02/2024')).toBeNull()
  })

  it('splitCsvLine handles quotes', () => {
    expect(splitCsvLine('a,"b,c","d ""e"""')).toEqual(['a', 'b,c', 'd "e"'])
  })

  it('validateRows rejects malformed server input', () => {
    expect(validateRows([{ date: '2024-01-01', pageviews: 1, visitors: 1 }], today)).toHaveLength(1)
    expect(validateRows([{ date: '2024-01-01', pageviews: -1, visitors: 1 }], today)).toBeNull()
    expect(validateRows([{ date: '2024-01-01', pageviews: 1.5, visitors: 1 }], today)).toBeNull()
    expect(validateRows([{ date: '2024-01-01', pageviews: 1, visitors: 1 }, { date: '2024-01-01', pageviews: 1, visitors: 1 }], today)).toBeNull()
    expect(validateRows([], today)).toBeNull()
    expect(validateRows('x', today)).toBeNull()
  })
})
