import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isDimensionKey, isMetricKey } from '@/lib/chartQuery'

export const dynamic = 'force-dynamic'

async function getOwnedSite(siteId: string, userId: string) {
  return prisma.site.findFirst({ where: { id: siteId, userId } })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const site = await getOwnedSite(params.siteId, session.user.id)
  if (!site) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const charts = await prisma.chart.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ charts })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const site = await getOwnedSite(params.siteId, session.user.id)
  if (!site) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const metric = body?.metric
  const dimension = body?.dimension
  const chartType = body?.chartType
  const filterField = typeof body?.filterField === 'string' ? body.filterField : null
  const filterValue = typeof body?.filterValue === 'string' ? body.filterValue : null

  if (!name || !isMetricKey(metric)) {
    return NextResponse.json({ error: 'Invalid chart config' }, { status: 400 })
  }
  if (dimension !== 'none' && !isDimensionKey(dimension)) {
    return NextResponse.json({ error: 'Invalid chart config' }, { status: 400 })
  }
  if (!['line', 'bar', 'pie', 'number'].includes(chartType)) {
    return NextResponse.json({ error: 'Invalid chart config' }, { status: 400 })
  }
  if (filterField && !isDimensionKey(filterField)) {
    return NextResponse.json({ error: 'Invalid chart config' }, { status: 400 })
  }

  const chart = await prisma.chart.create({
    data: { siteId: site.id, name, metric, dimension, chartType, filterField, filterValue },
  })
  return NextResponse.json({ chart })
}
