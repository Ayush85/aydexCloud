import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function ownedSite(siteId: string, userId: string) {
  return prisma.site.findFirst({ where: { id: siteId, userId } })
}

export async function GET(_req: NextRequest, { params }: { params: { siteId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const site = await ownedSite(params.siteId, session.user.id)
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const goals = await prisma.goal.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(goals)
}

export async function POST(req: NextRequest, { params }: { params: { siteId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const site = await ownedSite(params.siteId, session.user.id)
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, type, matchValue } = await req.json()
  if (!name || !matchValue || (type !== 'pageview' && type !== 'event')) {
    return NextResponse.json(
      { error: 'name, type ("pageview" | "event"), and matchValue are required.' },
      { status: 400 }
    )
  }

  const goal = await prisma.goal.create({
    data: { siteId: site.id, name, type, matchValue },
  })
  return NextResponse.json(goal, { status: 201 })
}
