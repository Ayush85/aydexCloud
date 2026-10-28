import type { Chart } from '@prisma/client'

// Whitelist of dimension keys -> SQL column/expression. Never interpolate a
// user-supplied string into SQL directly — only these fixed expressions are
// used, and all values still flow through ClickHouse query_params.
export const DIMENSIONS = {
  date: "toStartOfDay(timestamp)",
  url: 'url',
  referrer: 'referrer',
  browser: 'browser',
  os: 'os',
  device_type: 'device_type',
  event_name: 'event_name',
} as const

export type DimensionKey = keyof typeof DIMENSIONS

export const METRICS = {
  views: 'count()',
  visitors: 'uniqExact(visitor_hash)',
} as const

export type MetricKey = keyof typeof METRICS

export function isDimensionKey(v: string): v is DimensionKey {
  return Object.prototype.hasOwnProperty.call(DIMENSIONS, v)
}

export function isMetricKey(v: string): v is MetricKey {
  return Object.prototype.hasOwnProperty.call(METRICS, v)
}

export function buildChartQuery(
  chart: Pick<Chart, 'metric' | 'dimension' | 'filterField' | 'filterValue'>,
  siteTrackingId: string,
  days: number
): { sql: string; params: Record<string, unknown> } {
  if (!isMetricKey(chart.metric)) throw new Error('Invalid metric')
  const metricExpr = METRICS[chart.metric]

  const params: Record<string, unknown> = { sid: siteTrackingId, days }

  // 'number' charts have no grouping dimension — a single total for the period.
  if (chart.dimension === 'none') {
    let where = `site_id = {sid:String} AND timestamp >= now() - INTERVAL {days:Int32} DAY AND NOT startsWith(event_name, '_')`
    if (chart.filterField && isDimensionKey(chart.filterField) && chart.filterValue) {
      where += ` AND ${DIMENSIONS[chart.filterField]} = {filterValue:String}`
      params.filterValue = chart.filterValue
    }
    return {
      sql: `SELECT ${metricExpr} AS value FROM analytics.pageviews WHERE ${where}`,
      params,
    }
  }

  if (!isDimensionKey(chart.dimension)) throw new Error('Invalid dimension')
  const dimExpr = DIMENSIONS[chart.dimension]

  let where = `site_id = {sid:String} AND timestamp >= now() - INTERVAL {days:Int32} DAY AND NOT startsWith(event_name, '_')`
  if (chart.filterField && isDimensionKey(chart.filterField) && chart.filterValue) {
    where += ` AND ${DIMENSIONS[chart.filterField]} = {filterValue:String}`
    params.filterValue = chart.filterValue
  }

  const orderBy = chart.dimension === 'date' ? 'label ASC' : 'value DESC'
  const limit = chart.dimension === 'date' ? '' : 'LIMIT 20'

  return {
    sql: `
      SELECT ${dimExpr} AS label, ${metricExpr} AS value
      FROM analytics.pageviews
      WHERE ${where}
      GROUP BY label
      ORDER BY ${orderBy}
      ${limit}
    `,
    params,
  }
}
