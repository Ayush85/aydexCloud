import { prisma } from './prisma'
import * as stats from './stats'
import { buildInsights, type DimensionName, type Insight } from './insights'
import { INSIGHT_DIMENSIONS } from './stats'

// Report assembly shared by the dashboard route, the public API, the weekly
// digest and the MCP server (through the API). One definition of every number.

export interface SiteRef { id: string; trackingId: string }

export async function goalStats(site: SiteRef, w: stats.Window, uniqueVisitors: number) {
  const goals = await prisma.goal.findMany({ where: { siteId: site.id }, orderBy: { createdAt: 'asc' } })
  return Promise.all(
    goals.map(async (goal) => {
      const cond =
        goal.type === 'event'
          ? `event_name = {mv:String}`
          : `event_name = 'pageview' AND replaceRegexpOne(url, '\\\\?.*$', '') = {mv:String}`
      const rows = await stats.runQuery<{ completions: number }>(
        `SELECT uniqExact(visitor_hash) AS completions FROM analytics.pageviews
         WHERE site_id = {sid:String} AND timestamp >= now() - INTERVAL {days:Int32} DAY AND ${cond}`,
        { sid: w.sid, days: w.days, mv: goal.matchValue }
      )
      const completions = Number(rows[0]?.completions ?? 0)
      return {
        id: goal.id,
        name: goal.name,
        type: goal.type,
        matchValue: goal.matchValue,
        completions,
        conversionRate: uniqueVisitors ? completions / uniqueVisitors : 0,
      }
    })
  )
}

/** Totals + chart with imported history stitched in before the first native event. */
export async function trafficWithHistory(w: stats.Window) {
  const prevW = { ...w, prev: true }
  const [t, pt, c, ci, pi] = await Promise.all([
    stats.totals(w),
    stats.totals(prevW),
    stats.chart(w),
    stats.importedDaily(w),
    stats.importedDaily(prevW),
  ])
  const sum = (xs: stats.ChartPoint[], k: 'views' | 'visitors') => xs.reduce((a, x) => a + x[k], 0)
  return {
    totals: { total_views: Number(t.total_views) + sum(ci, 'views'), unique_visitors: Number(t.unique_visitors) + sum(ci, 'visitors') },
    prevTotals: { total_views: Number(pt.total_views) + sum(pi, 'views'), unique_visitors: Number(pt.unique_visitors) + sum(pi, 'visitors') },
    chart: [...ci, ...c],
    hasImported: ci.length > 0 || pi.length > 0,
  }
}

export async function getInsights(site: SiteRef, days: number): Promise<Insight[]> {
  const dimNames = Object.keys(INSIGHT_DIMENSIONS) as DimensionName[]
  const w = { sid: site.trackingId, days }
  const [cur, prev, daily, ...dims] = await Promise.all([
    stats.totals(w),
    stats.totals({ ...w, prev: true }),
    stats.dailyViews(site.trackingId),
    ...dimNames.map((d) => stats.dimensionDeltas(site.trackingId, days, d)),
  ])
  return buildInsights({
    periodLabel: days === 1 ? '24 hours' : `${days} days`,
    curTotal: Number(cur.total_views),
    prevTotal: Number(prev.total_views),
    dims: Object.fromEntries(dimNames.map((d, i) => [d, dims[i]])),
    daily: days >= 7 ? daily : undefined,
  })
}

/** Everything the dashboard shows, in one parallel fan-out. */
export async function getDashboard(site: SiteRef, period: stats.Period) {
  const days = stats.periodDays(period)
  const w = { sid: site.trackingId, days }
  const pw = { ...w, prev: true }
  const [traffic, pages, referrers, channels, aiReferrals, devices, browsers, campaigns, events, countries,
    eng, prevEng, entryExit, behavior, revenue, insights] = await Promise.all([
    trafficWithHistory(w),
    stats.pages(w), stats.referrers(w), stats.channels(w), stats.aiReferrals(w),
    stats.devices(w), stats.browsers(w), stats.campaigns(w), stats.events(w), stats.countries(w),
    stats.engagement(w), stats.engagement(pw),
    stats.entryExit(w), stats.behavior(w), stats.revenue(w),
    getInsights(site, days),
  ])
  const goals = await goalStats(site, w, Number(traffic.totals.unique_visitors))
  return {
    period,
    totals: traffic.totals,
    prevTotals: traffic.prevTotals,
    chart: traffic.chart,
    hasImported: traffic.hasImported,
    engagement: eng,
    prevEngagement: prevEng,
    pages, referrers, channels, aiReferrals, devices, browsers, campaigns, events, countries,
    entryPages: entryExit.entry,
    exitPages: entryExit.exit,
    behavior, revenue, insights, goals,
  }
}

/** Reports addressable by name from the public API / MCP server. */
export const API_REPORTS = [
  'overview', 'timeseries', 'pages', 'referrers', 'channels', 'ai-referrals', 'countries', 'devices',
  'browsers', 'campaigns', 'events', 'engagement', 'entry-exit', 'behavior', 'revenue', 'insights', 'funnels',
] as const
export type ApiReport = (typeof API_REPORTS)[number]
export const isApiReport = (v: string): v is ApiReport => (API_REPORTS as readonly string[]).includes(v)

export async function getReport(site: SiteRef, report: ApiReport, period: stats.Period): Promise<unknown> {
  const days = stats.periodDays(period)
  const w = { sid: site.trackingId, days }
  switch (report) {
    case 'overview': {
      const [t, eng] = await Promise.all([trafficWithHistory(w), stats.engagement(w)])
      return { period, totals: t.totals, prevTotals: t.prevTotals, engagement: eng }
    }
    case 'timeseries': return { period, points: (await trafficWithHistory(w)).chart }
    case 'pages': return stats.pages(w, 50)
    case 'referrers': return stats.referrers(w, 50)
    case 'channels': return stats.channels(w)
    case 'ai-referrals': return stats.aiReferrals(w)
    case 'countries': return stats.countries(w)
    case 'devices': return stats.devices(w)
    case 'browsers': return stats.browsers(w)
    case 'campaigns': return stats.campaigns(w)
    case 'events': return stats.events(w)
    case 'engagement': return { current: await stats.engagement(w), previous: await stats.engagement({ ...w, prev: true }) }
    case 'entry-exit': return stats.entryExit(w)
    case 'behavior': return stats.behavior(w)
    case 'revenue': return stats.revenue(w)
    case 'insights': return getInsights(site, days)
    case 'funnels': {
      const fs = await prisma.funnel.findMany({ where: { siteId: site.id }, orderBy: { createdAt: 'asc' } })
      return Promise.all(
        fs.map(async (f) => ({ id: f.id, name: f.name, steps: await stats.funnel(w, f.steps as unknown as stats.FunnelStep[]) }))
      )
    }
  }
}
