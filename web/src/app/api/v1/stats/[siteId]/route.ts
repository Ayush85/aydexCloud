import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/apiAuth'
import { trafficWithHistory } from '@/lib/reports'
import { pages, parsePeriod, periodDays } from '@/lib/stats'

export const dynamic = 'force-dynamic'

/** Legacy summary endpoint, kept for backward compatibility. Prefer /api/v1/sites/:id/:report. */
export async function GET(req: NextRequest, { params }: { params: { siteId: string } }) {
  const auth = await requireApiUser(req)
  if ('response' in auth) return auth.response

  const site = await prisma.site.findFirst({ where: { id: params.siteId, userId: auth.user.id } })
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const w = { sid: site.trackingId, days: periodDays(parsePeriod(req.nextUrl.searchParams.get('period'))) }
  const [traffic, topPages] = await Promise.all([trafficWithHistory(w), pages(w)])
  return NextResponse.json({ totals: traffic.totals, chart: traffic.chart, pages: topPages })
}
