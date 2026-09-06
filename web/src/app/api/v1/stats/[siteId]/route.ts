import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ch } from '@/lib/clickhouse'
import { authenticateApiKey } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

type Row = Record<string, unknown>

async function query<T extends Row>(sql: string, params: Record<string, unknown>): Promise<T[]> {
  const rs = await ch.query({ query: sql, query_params: params, format: 'JSONEachRow' })
  return rs.json<T>()
}

/** Public REST API — Pro+ only. Bearer-token auth via API keys (see /dashboard/settings/api-keys). */
export async function GET(req: NextRequest, { params }: { params: { siteId: string } }) {
  const user = await authenticateApiKey(req)
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or missing API key, or your plan does not include API access.' },
      { status: 403 }
    )
  }

  const site = await prisma.site.findFirst({ where: { id: params.siteId, userId: user.id } })
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const period = req.nextUrl.searchParams.get('period') ?? '7d'
  const days = period === '30d' ? 30 : period === 'today' ? 1 : 7
  const sid = site.trackingId

  const [totals, chart, pages] = await Promise.all([
    query<{ total_views: number; unique_visitors: number }>(`
      SELECT count() AS total_views, uniqExact(visitor_hash) AS unique_visitors
      FROM analytics.pageviews
      WHERE site_id = {sid:String} AND timestamp >= now() - INTERVAL {days:Int32} DAY AND event_name = 'pageview'
    `, { sid, days }),
    query<{ date: string; views: number; visitors: number }>(`
      SELECT toStartOfDay(timestamp) AS date, count() AS views, uniqExact(visitor_hash) AS visitors
      FROM analytics.pageviews
      WHERE site_id = {sid:String} AND timestamp >= now() - INTERVAL {days:Int32} DAY AND event_name = 'pageview'
      GROUP BY date ORDER BY date ASC
    `, { sid, days }),
    query<{ url: string; views: number; visitors: number }>(`
      SELECT url, count() AS views, uniqExact(visitor_hash) AS visitors
      FROM analytics.pageviews
      WHERE site_id = {sid:String} AND timestamp >= now() - INTERVAL {days:Int32} DAY AND event_name = 'pageview'
      GROUP BY url ORDER BY views DESC LIMIT 10
    `, { sid, days }),
  ])

  return NextResponse.json({
    totals: totals[0] ?? { total_views: 0, unique_visitors: 0 },
    chart,
    pages,
  })
}
