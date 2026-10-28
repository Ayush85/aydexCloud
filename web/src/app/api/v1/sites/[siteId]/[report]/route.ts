import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/apiAuth'
import { API_REPORTS, getReport, isApiReport } from '@/lib/reports'
import { PERIODS, parsePeriod } from '@/lib/stats'

export const dynamic = 'force-dynamic'

/** GET /api/v1/sites/:siteId/:report?period=today|7d|30d|90d */
export async function GET(
  req: NextRequest,
  { params }: { params: { siteId: string; report: string } }
) {
  const auth = await requireApiUser(req)
  if ('response' in auth) return auth.response

  if (!isApiReport(params.report)) {
    return NextResponse.json(
      { error: `Unknown report. Available: ${API_REPORTS.join(', ')}` },
      { status: 404 }
    )
  }
  const rawPeriod = req.nextUrl.searchParams.get('period')
  if (rawPeriod && !PERIODS.includes(rawPeriod as never)) {
    return NextResponse.json({ error: `Invalid period. Use one of: ${PERIODS.join(', ')}` }, { status: 400 })
  }

  const site = await prisma.site.findFirst({ where: { id: params.siteId, userId: auth.user.id } })
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  const data = await getReport(site, params.report, parsePeriod(rawPeriod))
  return NextResponse.json({ site: { id: site.id, name: site.name }, report: params.report, data })
}
