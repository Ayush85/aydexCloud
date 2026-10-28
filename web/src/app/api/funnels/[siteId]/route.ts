import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { funnel, isFunnelSteps, parsePeriod, periodDays, type FunnelStep } from '@/lib/stats'

export const dynamic = 'force-dynamic'

async function ownedSite(siteId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const site = await prisma.site.findFirst({ where: { id: siteId, userId: session.user.id } })
  if (!site) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  return { site }
}

/** Lists the site's funnels with their computed step counts for ?period=. */
export async function GET(req: NextRequest, { params }: { params: { siteId: string } }) {
  const r = await ownedSite(params.siteId)
  if (r.error) return r.error
  const days = periodDays(parsePeriod(req.nextUrl.searchParams.get('period')))
  const funnels = await prisma.funnel.findMany({ where: { siteId: r.site.id }, orderBy: { createdAt: 'asc' } })
  const out = await Promise.all(
    funnels.map(async (f) => {
      const steps = f.steps as unknown as FunnelStep[]
      return { id: f.id, name: f.name, steps: await funnel({ sid: r.site.trackingId, days }, steps) }
    })
  )
  return NextResponse.json(out)
}

export async function POST(req: NextRequest, { params }: { params: { siteId: string } }) {
  const r = await ownedSite(params.siteId)
  if (r.error) return r.error
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : ''
  if (!name || !isFunnelSteps(body?.steps)) {
    return NextResponse.json(
      { error: 'name and 2-8 steps ({ type: "page" | "event", value }) are required.' },
      { status: 400 }
    )
  }
  const steps = body.steps.map((s: FunnelStep) => ({ type: s.type, value: s.value.trim() }))
  const created = await prisma.funnel.create({ data: { siteId: r.site.id, name, steps } })
  return NextResponse.json({ id: created.id, name: created.name }, { status: 201 })
}
