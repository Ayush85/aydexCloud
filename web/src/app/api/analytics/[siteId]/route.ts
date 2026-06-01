import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
  { params }: { params: { siteId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const site = await prisma.site.findFirst({
    where: { id: params.siteId, userId: session.user.id },
  })
  if (!site) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const period = req.nextUrl.searchParams.get('period') ?? '7d'
  const days = period === '30d' ? 30 : period === 'today' ? 1 : 7
  const sid = site.trackingId

  const [totals, chart, pages, referrers, devices, browsers] = await Promise.all([
    query<{ total_views: number; unique_visitors: number }>(`
      SELECT
        count()                  AS total_views,
        uniqExact(visitor_hash)  AS unique_visitors
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
    `, { sid, days }),

    query<{ date: string; views: number; visitors: number }>(`
      SELECT
        toStartOfDay(timestamp)  AS date,
        count()                  AS views,
        uniqExact(visitor_hash)  AS visitors
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
      GROUP BY date
      ORDER BY date ASC
    `, { sid, days }),

    query<{ url: string; views: number; visitors: number }>(`
      SELECT
        url,
        count()                 AS views,
        uniqExact(visitor_hash) AS visitors
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
      GROUP BY url
      ORDER BY views DESC
      LIMIT 10
    `, { sid, days }),

    query<{ referrer: string; views: number }>(`
      SELECT
        referrer,
        count() AS views
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
        AND referrer != ''
      GROUP BY referrer
      ORDER BY views DESC
      LIMIT 10
    `, { sid, days }),

    query<{ device_type: string; views: number }>(`
      SELECT
        device_type,
        count() AS views
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
      GROUP BY device_type
      ORDER BY views DESC
    `, { sid, days }),

    query<{ browser: string; views: number }>(`
      SELECT
        browser,
        count() AS views
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
      GROUP BY browser
      ORDER BY views DESC
      LIMIT 8
    `, { sid, days }),
  ])

  return NextResponse.json({
    totals: totals[0] ?? { total_views: 0, unique_visitors: 0 },
    chart,
    pages,
    referrers,
    devices,
    browsers,
  })
}
