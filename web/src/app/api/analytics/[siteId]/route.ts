import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDashboard } from '@/lib/reports'
import { parsePeriod } from '@/lib/stats'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { siteId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const site = await prisma.site.findFirst({ where: { id: params.siteId, userId: session.user.id } })
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const period = parsePeriod(req.nextUrl.searchParams.get('period'))
  return NextResponse.json(await getDashboard(site, period))
}
