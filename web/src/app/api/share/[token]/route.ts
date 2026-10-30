import { clientIp, overLimit } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ch } from '@/lib/clickhouse'

export const dynamic = 'force-dynamic'

type Row = Record<string, unknown>
async function query<T extends Row>(sql: string, params: Record<string, unknown>): Promise<T[]> {
  const rs = await ch.query({ query: sql, query_params: params, format: 'JSONEachRow' })
  return rs.json<T>()
}

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  // Unauthenticated and runs several ClickHouse queries, so cap it per client.
  if (await overLimit(`share:${clientIp(req.headers)}`, 60, 60)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }
  const site = await prisma.site.findFirst({
    where: { publicToken: params.token, isPublic: true },
  })
  if (!site) {
    return NextResponse.json({ error: 'Not found or not public' }, { status: 404 })
  }

  const period = req.nextUrl.searchParams.get('period') ?? '7d'
  const days = period === '30d' ? 30 : period === 'today' ? 1 : 7
  const sid = site.trackingId

  const [totals, prevTotals, chart, pages, referrers, devices] = await Promise.all([
    query<{ total_views: number; unique_visitors: number }>(`
      SELECT count() AS total_views, uniqExact(visitor_hash) AS unique_visitors
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
        AND event_name = 'pageview'
    `, { sid, days }),

    query<{ total_views: number; unique_visitors: number }>(`
      SELECT count() AS total_views, uniqExact(visitor_hash) AS unique_visitors
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {prevDays:Int32} DAY
        AND timestamp <  now() - INTERVAL {days:Int32} DAY
        AND event_name = 'pageview'
    `, { sid, days, prevDays: days * 2 }),

    query<{ date: string; views: number; visitors: number }>(`
      SELECT toStartOfDay(timestamp) AS date, count() AS views, uniqExact(visitor_hash) AS visitors
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
        AND event_name = 'pageview'
      GROUP BY date ORDER BY date ASC
    `, { sid, days }),

    query<{ url: string; views: number; visitors: number }>(`
      SELECT url, count() AS views, uniqExact(visitor_hash) AS visitors
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
        AND event_name = 'pageview'
      GROUP BY url ORDER BY views DESC LIMIT 10
    `, { sid, days }),

    query<{ referrer: string; views: number }>(`
      SELECT referrer, count() AS views
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
        AND referrer != '' AND event_name = 'pageview'
      GROUP BY referrer ORDER BY views DESC LIMIT 10
    `, { sid, days }),

    query<{ device_type: string; views: number }>(`
      SELECT device_type, count() AS views
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
        AND event_name = 'pageview'
      GROUP BY device_type ORDER BY views DESC
    `, { sid, days }),
  ])

  return NextResponse.json({
    site: { name: site.name, domain: site.domain },
    totals:     totals[0]     ?? { total_views: 0, unique_visitors: 0 },
    prevTotals: prevTotals[0] ?? { total_views: 0, unique_visitors: 0 },
    chart,
    pages,
    referrers,
    devices,
  })
}
