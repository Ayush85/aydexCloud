import { ch } from './clickhouse'
import { CHANNEL_SQL, SOURCE_SQL } from './channels'

// Shared analytics queries. Used by the dashboard (session auth), the public
// REST API (API-key auth), the weekly digest and the MCP server's backing API,
// so every surface reports identical numbers.
//
// Conventions:
//  * "pageview" rows are real page loads. Rows whose event_name starts with "_"
//    are internal behaviour signals (_dur, _rage, _dead, _err, _out, _dl): they
//    are excluded from every count unless a query asks for them explicitly.
//  * A "session" is (visitor_hash, UTC day) — visitor ids are cookieless and
//    rotate daily, so that is the finest honest definition.

export type Period = 'today' | '7d' | '30d' | '90d'
export const PERIODS: Period[] = ['today', '7d', '30d', '90d']

export function parsePeriod(v: string | null | undefined): Period {
  return PERIODS.includes(v as Period) ? (v as Period) : '7d'
}
export function periodDays(p: Period): number {
  return p === '90d' ? 90 : p === '30d' ? 30 : p === 'today' ? 1 : 7
}

type Row = Record<string, unknown>

export async function runQuery<T extends Row>(sql: string, params: Record<string, unknown>): Promise<T[]> {
  const rs = await ch.query({ query: sql, query_params: params, format: 'JSONEachRow' })
  return rs.json<T>()
}

export interface Window {
  sid: string
  days: number
  /** true = the equal-length window immediately before the current one */
  prev?: boolean
}

const PV = `event_name = 'pageview'`
/** Custom (user-defined) events only. */
export const CUSTOM_EVENT = `event_name != 'pageview' AND NOT startsWith(event_name, '_')`

function winSql(prev?: boolean): string {
  return prev
    ? `timestamp >= now() - INTERVAL {from:Int32} DAY AND timestamp < now() - INTERVAL {days:Int32} DAY`
    : `timestamp >= now() - INTERVAL {days:Int32} DAY`
}
function base(w: Window, extra = PV): { where: string; params: Record<string, unknown> } {
  return {
    where: `site_id = {sid:String} AND ${winSql(w.prev)} AND ${extra}`,
    params: { sid: w.sid, days: w.days, from: w.days * 2 },
  }
}

// ── Totals & chart ─────────────────────────────────────────────────────────

export type Totals = { total_views: number; unique_visitors: number }

export async function totals(w: Window): Promise<Totals> {
  const { where, params } = base(w)
  const rows = await runQuery<Totals>(
    `SELECT count() AS total_views, uniqExact(visitor_hash) AS unique_visitors FROM analytics.pageviews WHERE ${where}`,
    params
  )
  return rows[0] ?? { total_views: 0, unique_visitors: 0 }
}

export type ChartPoint = { date: string; views: number; visitors: number; imported?: boolean }

export async function chart(w: Window): Promise<ChartPoint[]> {
  const { where, params } = base(w)
  return runQuery<ChartPoint>(
    `SELECT toStartOfDay(timestamp) AS date, count() AS views, uniqExact(visitor_hash) AS visitors
     FROM analytics.pageviews WHERE ${where} GROUP BY date ORDER BY date ASC`,
    params
  )
}

/** Imported (e.g. GA4) daily history, only for days before the site's first native event. */
export async function importedDaily(w: Window): Promise<ChartPoint[]> {
  // The table is created by the tracker on startup; until that has run (or if the
  // query fails for any reason) imported history must never break the dashboard.
  const rows = await runQuery<{ day: string; views: string | number; visitors: string | number }>(
    `SELECT toString(date) AS day, sum(pageviews) AS views, sum(visitors) AS visitors
     FROM analytics.imported_daily FINAL
     WHERE site_id = {sid:String}
       AND date >= today() - {lo:Int32} AND date <= today() - {hi:Int32}
       AND date < (SELECT if(count() = 0, toDate('2100-01-01'), toDate(min(timestamp)))
                   FROM analytics.pageviews WHERE site_id = {sid:String})
     GROUP BY day ORDER BY day ASC`,
    { sid: w.sid, lo: w.prev ? w.days * 2 : w.days, hi: w.prev ? w.days + 1 : 0 }
  ).catch(() => [])
  return rows.map((r) => ({
    date: `${r.day} 00:00:00`,
    views: Number(r.views),
    visitors: Number(r.visitors),
    imported: true,
  }))
}

// ── Breakdowns ─────────────────────────────────────────────────────────────

export async function pages(w: Window, limit = 10) {
  const { where, params } = base(w)
  return runQuery<{ url: string; views: number; visitors: number }>(
    `SELECT url, count() AS views, uniqExact(visitor_hash) AS visitors
     FROM analytics.pageviews WHERE ${where} GROUP BY url ORDER BY views DESC LIMIT ${Math.min(limit, 100)}`,
    params
  )
}

export async function referrers(w: Window, limit = 10) {
  const { where, params } = base(w, `${PV} AND referrer != ''`)
  return runQuery<{ referrer: string; views: number }>(
    `SELECT referrer, count() AS views FROM analytics.pageviews WHERE ${where}
     GROUP BY referrer ORDER BY views DESC LIMIT ${Math.min(limit, 100)}`,
    params
  )
}

export async function channels(w: Window) {
  const { where, params } = base(w)
  return runQuery<{ channel: string; views: number; visitors: number }>(
    `SELECT ${CHANNEL_SQL} AS channel, count() AS views, uniqExact(visitor_hash) AS visitors
     FROM analytics.pageviews WHERE ${where} GROUP BY channel ORDER BY views DESC`,
    params
  )
}

/** Visits that arrived from an AI assistant, split by assistant host / utm source. */
export async function aiReferrals(w: Window) {
  const { where, params } = base(w)
  return runQuery<{ source: string; views: number; visitors: number }>(
    `SELECT if(referrer != '', referrer, lower(extract(url, '[?&]utm_source=([^&]+)'))) AS source,
            count() AS views, uniqExact(visitor_hash) AS visitors
     FROM analytics.pageviews WHERE ${where} AND ${CHANNEL_SQL} = 'AI assistants'
     GROUP BY source ORDER BY views DESC LIMIT 20`,
    params
  )
}

export async function devices(w: Window) {
  const { where, params } = base(w)
  return runQuery<{ device_type: string; views: number }>(
    `SELECT device_type, count() AS views FROM analytics.pageviews WHERE ${where} GROUP BY device_type ORDER BY views DESC`,
    params
  )
}

export async function browsers(w: Window) {
  const { where, params } = base(w)
  return runQuery<{ browser: string; views: number }>(
    `SELECT browser, count() AS views FROM analytics.pageviews WHERE ${where} GROUP BY browser ORDER BY views DESC LIMIT 8`,
    params
  )
}

export async function countries(w: Window) {
  const { where, params } = base(w, `${PV} AND country != ''`)
  return runQuery<{ country: string; views: number }>(
    `SELECT country, count() AS views FROM analytics.pageviews WHERE ${where} GROUP BY country ORDER BY views DESC LIMIT 10`,
    params
  )
}

export async function campaigns(w: Window) {
  const { where, params } = base(w, `${PV} AND url LIKE '%utm_%'`)
  return runQuery<{ source: string; medium: string; campaign: string; visits: number; visitors: number }>(
    `SELECT extract(url, '[?&]utm_source=([^&]+)') AS source,
            extract(url, '[?&]utm_medium=([^&]+)') AS medium,
            extract(url, '[?&]utm_campaign=([^&]+)') AS campaign,
            count() AS visits, uniqExact(visitor_hash) AS visitors
     FROM analytics.pageviews WHERE ${where}
     GROUP BY source, medium, campaign HAVING source != '' OR campaign != ''
     ORDER BY visits DESC LIMIT 20`,
    params
  )
}

export async function events(w: Window) {
  const { where, params } = base(w, CUSTOM_EVENT)
  return runQuery<{ event_name: string; count: number; unique_visitors: number }>(
    `SELECT event_name, count() AS count, uniqExact(visitor_hash) AS unique_visitors
     FROM analytics.pageviews WHERE ${where} GROUP BY event_name ORDER BY count DESC LIMIT 20`,
    params
  )
}

// ── Engagement: bounce, time on page, entry/exit ───────────────────────────

export interface Engagement {
  sessions: number
  bounce_rate: number // 0..1
  avg_time_s: number // average engaged seconds per page view that reported time
  avg_scroll: number // average deepest scroll, 0..100
}

export async function engagement(w: Window): Promise<Engagement> {
  const pv = base(w)
  const dur = base(w, `event_name = '_dur'`)
  const [s, t] = await Promise.all([
    runQuery<{ sessions: number; bounces: number }>(
      `SELECT count() AS sessions, countIf(pv = 1) AS bounces FROM (
         SELECT visitor_hash, toDate(timestamp) AS d, count() AS pv
         FROM analytics.pageviews WHERE ${pv.where} GROUP BY visitor_hash, d)`,
      pv.params
    ),
    runQuery<{ avg_ms: number | null; avg_scroll: number | null }>(
      `SELECT avg(ms) AS avg_ms, avg(sd) AS avg_scroll FROM (
         SELECT visitor_hash, JSONExtractString(event_props, 'pid') AS pid,
                sum(JSONExtractUInt(event_props, 'ms')) AS ms,
                max(JSONExtractUInt(event_props, 'sd')) AS sd
         FROM analytics.pageviews WHERE ${dur.where} GROUP BY visitor_hash, pid)`,
      dur.params
    ),
  ])
  const sessions = Number(s[0]?.sessions ?? 0)
  const bounces = Number(s[0]?.bounces ?? 0)
  return {
    sessions,
    bounce_rate: sessions ? bounces / sessions : 0,
    avg_time_s: Math.round(Number(t[0]?.avg_ms ?? 0) / 1000),
    avg_scroll: Math.round(Number(t[0]?.avg_scroll ?? 0)),
  }
}

export async function entryExit(w: Window) {
  const { where, params } = base(w)
  const inner = (col: 'entry' | 'exit') =>
    `SELECT ${col} AS url, count() AS sessions FROM (
       SELECT visitor_hash, toDate(timestamp) AS d,
              argMin(url, timestamp) AS entry, argMax(url, timestamp) AS exit
       FROM analytics.pageviews WHERE ${where} GROUP BY visitor_hash, d)
     GROUP BY url ORDER BY sessions DESC LIMIT 10`
  const [entry, exit] = await Promise.all([
    runQuery<{ url: string; sessions: number }>(inner('entry'), params),
    runQuery<{ url: string; sessions: number }>(inner('exit'), params),
  ])
  return { entry, exit }
}

// ── Behaviour signals (counted, never recorded) ────────────────────────────

export interface Behavior {
  rage: { page: string; target: string; count: number }[]
  dead: { page: string; target: string; count: number }[]
  errors: { message: string; file: string; count: number; visitors: number }[]
  outbound: { url: string; count: number }[]
  downloads: { file: string; count: number }[]
  totals: { rage: number; dead: number; errors: number }
}

export async function behavior(w: Window): Promise<Behavior> {
  const sig = (names: string) => base(w, `event_name IN (${names})`)
  const q1 = sig(`'_rage'`), q2 = sig(`'_dead'`), q3 = sig(`'_err'`), q4 = sig(`'_out'`), q5 = sig(`'_dl'`)
  const frustration = (b: ReturnType<typeof sig>) =>
    runQuery<{ page: string; target: string; count: number }>(
      `SELECT replaceRegexpOne(url, '\\\\?.*$', '') AS page, JSONExtractString(event_props, 't') AS target, count() AS count
       FROM analytics.pageviews WHERE ${b.where} GROUP BY page, target ORDER BY count DESC LIMIT 10`,
      b.params
    )
  const [rage, dead, errors, outbound, downloads] = await Promise.all([
    frustration(q1),
    frustration(q2),
    runQuery<{ message: string; file: string; count: number; visitors: number }>(
      `SELECT JSONExtractString(event_props, 'm') AS message, JSONExtractString(event_props, 'f') AS file,
              count() AS count, uniqExact(visitor_hash) AS visitors
       FROM analytics.pageviews WHERE ${q3.where} GROUP BY message, file ORDER BY count DESC LIMIT 10`,
      q3.params
    ),
    runQuery<{ url: string; count: number }>(
      `SELECT JSONExtractString(event_props, 'u') AS url, count() AS count
       FROM analytics.pageviews WHERE ${q4.where} GROUP BY url ORDER BY count DESC LIMIT 10`,
      q4.params
    ),
    runQuery<{ file: string; count: number }>(
      `SELECT JSONExtractString(event_props, 'f') AS file, count() AS count
       FROM analytics.pageviews WHERE ${q5.where} GROUP BY file ORDER BY count DESC LIMIT 10`,
      q5.params
    ),
  ])
  const sum = <T extends { count: number }>(xs: T[]) => xs.reduce((a, x) => a + Number(x.count), 0)
  return { rage, dead, errors, outbound, downloads, totals: { rage: sum(rage), dead: sum(dead), errors: sum(errors) } }
}

// ── Revenue attribution ────────────────────────────────────────────────────
// Convention: aydex.track('purchase', { revenue: 49, currency: 'USD' }).
// A purchase is attributed to the source of that visitor's first pageview the
// same UTC day (cookieless ids rotate daily; with data-storage enabled the id
// is stable, but the join stays same-day, which is conservative).

export type RevenueRow = { source: string; currency: string; orders: number; buyers: number; revenue: number }

export async function revenue(w: Window): Promise<RevenueRow[]> {
  const buy = base(w, CUSTOM_EVENT)
  const first = base(w)
  return runQuery<RevenueRow>(
    `SELECT if(f.url = '', '(unattributed)', ${SOURCE_SQL}) AS source, p.currency AS currency,
            count() AS orders, uniqExact(p.visitor_hash) AS buyers, sum(p.rev) AS revenue
     FROM (
       SELECT visitor_hash, toDate(timestamp) AS d,
              JSONExtractFloat(event_props, 'revenue') AS rev,
              upper(JSONExtractString(event_props, 'currency')) AS currency
       FROM analytics.pageviews WHERE ${buy.where} AND JSONExtractFloat(event_props, 'revenue') > 0
     ) AS p
     LEFT JOIN (
       SELECT visitor_hash, toDate(timestamp) AS d, argMin(url, timestamp) AS url, argMin(referrer, timestamp) AS referrer
       FROM analytics.pageviews WHERE ${first.where} GROUP BY visitor_hash, d
     ) AS f ON p.visitor_hash = f.visitor_hash AND p.d = f.d
     GROUP BY source, currency ORDER BY revenue DESC LIMIT 30`,
    buy.params
  )
}

// ── Funnels ────────────────────────────────────────────────────────────────

export interface FunnelStep { type: 'page' | 'event'; value: string }
export const MAX_FUNNEL_STEPS = 8

export function isFunnelSteps(v: unknown): v is FunnelStep[] {
  return (
    Array.isArray(v) &&
    v.length >= 2 &&
    v.length <= MAX_FUNNEL_STEPS &&
    v.every(
      (s) =>
        s && (s.type === 'page' || s.type === 'event') &&
        typeof s.value === 'string' && s.value.trim().length > 0 && s.value.length <= 200
    )
  )
}

export function buildFunnelQuery(w: Window, steps: FunnelStep[]): { sql: string; params: Record<string, unknown> } {
  const b = base(w, `(event_name = 'pageview' OR (${CUSTOM_EVENT}))`)
  const params: Record<string, unknown> = { ...b.params }
  const conds = steps.map((s, i) => {
    params[`s${i}`] = s.value.trim()
    return s.type === 'page'
      ? `event_name = 'pageview' AND replaceRegexpOne(url, '\\\\?.*$', '') = {s${i}:String}`
      : `event_name = {s${i}:String}`
  })
  return {
    sql: `SELECT level, count() AS visitors FROM (
            SELECT visitor_hash, windowFunnel(86400)(timestamp, ${conds.join(', ')}) AS level
            FROM analytics.pageviews WHERE ${b.where} GROUP BY visitor_hash)
          GROUP BY level`,
    params,
  }
}

/** Turns windowFunnel level counts into per-step cumulative visitors. */
export function funnelCounts(levels: { level: number | string; visitors: number | string }[], nSteps: number): number[] {
  const out: number[] = []
  for (let i = 1; i <= nSteps; i++) {
    out.push(levels.filter((l) => Number(l.level) >= i).reduce((a, l) => a + Number(l.visitors), 0))
  }
  return out
}

export async function funnel(w: Window, steps: FunnelStep[]) {
  const { sql, params } = buildFunnelQuery(w, steps)
  const rows = await runQuery<{ level: number; visitors: number }>(sql, params)
  const counts = funnelCounts(rows, steps.length)
  return steps.map((s, i) => ({
    ...s,
    visitors: counts[i],
    conversionFromStart: counts[0] ? counts[i] / counts[0] : 0,
    conversionFromPrev: i === 0 ? 1 : counts[i - 1] ? counts[i] / counts[i - 1] : 0,
  }))
}

// ── Insight inputs ─────────────────────────────────────────────────────────

export const INSIGHT_DIMENSIONS = {
  channel: CHANNEL_SQL,
  referrer: `if(referrer = '', '(direct)', referrer)`,
  page: `replaceRegexpOne(url, '\\\\?.*$', '')`,
  country: `if(country = '', '(unknown)', country)`,
  device: `device_type`,
} as const
export type InsightDimension = keyof typeof INSIGHT_DIMENSIONS

/** Pageview counts per dimension value for the current and previous window, in one scan. */
export async function dimensionDeltas(sid: string, days: number, dim: InsightDimension) {
  const rows = await runQuery<{ key: string; cur: number | string; prev: number | string }>(
    `SELECT dim AS key, countIf(is_cur) AS cur, countIf(NOT is_cur) AS prev FROM (
       SELECT ${INSIGHT_DIMENSIONS[dim]} AS dim, timestamp >= now() - INTERVAL {days:Int32} DAY AS is_cur
       FROM analytics.pageviews
       WHERE site_id = {sid:String} AND timestamp >= now() - INTERVAL {from:Int32} DAY AND ${PV})
     GROUP BY key HAVING cur > 0 OR prev > 0 ORDER BY cur + prev DESC LIMIT 200`,
    { sid, days, from: days * 2 }
  )
  return rows.map((r) => ({ key: r.key, cur: Number(r.cur), prev: Number(r.prev) }))
}

/** Daily pageview counts for the last `n` complete UTC days (today excluded), oldest first, zero-filled. */
export async function dailyViews(sid: string, n = 15): Promise<number[]> {
  const rows = await runQuery<{ d: string; views: number | string }>(
    `SELECT toString(toDate(timestamp)) AS d, count() AS views FROM analytics.pageviews
     WHERE site_id = {sid:String} AND ${PV}
       AND toDate(timestamp) >= today() - {n:Int32} AND toDate(timestamp) < today()
     GROUP BY d`,
    { sid, n }
  )
  const by = new Map(rows.map((r) => [r.d, Number(r.views)]))
  const out: number[] = []
  const now = new Date()
  for (let i = n; i >= 1; i--) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
    out.push(by.get(day.toISOString().slice(0, 10)) ?? 0)
  }
  return out
}
