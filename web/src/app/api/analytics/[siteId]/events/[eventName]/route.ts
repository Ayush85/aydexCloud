import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ch } from '@/lib/clickhouse'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { siteId: string; eventName: string } }
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

  const rs = await ch.query({
    query: `
      SELECT timestamp, event_props
      FROM analytics.pageviews
      WHERE site_id = {sid:String} AND event_name = {eventName:String} AND NOT startsWith(event_name, '_')
      ORDER BY timestamp DESC
      LIMIT 50
    `,
    query_params: { sid: site.trackingId, eventName: params.eventName },
    format: 'JSONEachRow',
  })
  const rows = await rs.json<{ timestamp: string; event_props: string }>()
  return NextResponse.json({ rows })
}
