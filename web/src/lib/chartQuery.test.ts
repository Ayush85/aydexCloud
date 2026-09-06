import { describe, it, expect } from 'vitest'
import { buildChartQuery, isDimensionKey, isMetricKey } from './chartQuery'

describe('chartQuery whitelist', () => {
  it('accepts only known dimension keys', () => {
    expect(isDimensionKey('url')).toBe(true)
    expect(isDimensionKey('visitor_hash')).toBe(false)
    expect(isDimensionKey("url'; DROP TABLE analytics.pageviews; --")).toBe(false)
  })

  it('accepts only known metric keys', () => {
    expect(isMetricKey('views')).toBe(true)
    expect(isMetricKey('count() -- ')).toBe(false)
  })

  it('throws on an invalid metric rather than interpolating it', () => {
    expect(() =>
      buildChartQuery(
        { metric: 'DROP TABLE', dimension: 'url', filterField: null, filterValue: null },
        'site123',
        7
      )
    ).toThrow('Invalid metric')
  })

  it('throws on an invalid dimension rather than interpolating it', () => {
    expect(() =>
      buildChartQuery(
        { metric: 'views', dimension: "url'; --", filterField: null, filterValue: null },
        'site123',
        7
      )
    ).toThrow('Invalid dimension')
  })

  it('builds a totals-only query for dimension "none"', () => {
    const { sql, params } = buildChartQuery(
      { metric: 'visitors', dimension: 'none', filterField: null, filterValue: null },
      'site123',
      30
    )
    expect(sql).toContain('uniqExact(visitor_hash)')
    expect(sql).not.toContain('GROUP BY')
    expect(params).toEqual({ sid: 'site123', days: 30 })
  })

  it('passes filter values only through query_params, never inlined', () => {
    const { sql, params } = buildChartQuery(
      { metric: 'views', dimension: 'browser', filterField: 'os', filterValue: "x'); DROP TABLE users; --" },
      'site123',
      7
    )
    expect(sql).not.toContain('DROP TABLE')
    expect(params.filterValue).toBe("x'); DROP TABLE users; --")
  })

  it('ignores an unwhitelisted filterField instead of interpolating it', () => {
    const { sql, params } = buildChartQuery(
      { metric: 'views', dimension: 'browser', filterField: 'visitor_hash', filterValue: 'abc' },
      'site123',
      7
    )
    expect(sql).not.toContain('visitor_hash')
    expect(params.filterValue).toBeUndefined()
  })
})
