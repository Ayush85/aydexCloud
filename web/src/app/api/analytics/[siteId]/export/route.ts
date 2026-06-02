import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ch } from '@/lib/clickhouse'

export const dynamic = 'force-dynamic'

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

  const period = req.nextUrl.searchParams.get('period') ?? '30d'
  const days = period === '7d' ? 7 : period === 'today' ? 1 : 30
  const sid = site.trackingId

  const rs = await ch.query({
    query: `
      SELECT
        toDate(timestamp)           AS date,
        url                         AS page,
        referrer,
        browser,
        os,
        device_type,
        count()                     AS pageviews,
        uniqExact(visitor_hash)     AS unique_visitors
      FROM analytics.pageviews
      WHERE site_id = {sid:String}
        AND timestamp >= now() - INTERVAL {days:Int32} DAY
        AND event_name = 'pageview'
      GROUP BY date, page, referrer, browser, os, device_type
      ORDER BY date DESC, pageviews DESC
      LIMIT 50000
    `,
    query_params: { sid, days },
    format: 'JSONEachRow',
  })

  type Row = {
    date: string; page: string; referrer: string; browser: string
    os: string; device_type: string; pageviews: number; unique_visitors: number
  }
  const rows = await rs.json<Row>()

  const header = 'date,page,referrer,browser,os,device_type,pageviews,unique_visitors\n'
  const csvRows = rows.map((r) =>
    [r.date, r.page, r.referrer, r.browser, r.os, r.device_type, r.pageviews, r.unique_visitors]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  )
  const csv = header + csvRows.join('\n')

  const filename = `${site.domain}-analytics-${period}.csv`
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
