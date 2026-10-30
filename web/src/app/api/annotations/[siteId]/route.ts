import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseAnnotation, MAX_ANNOTATIONS_PER_SITE } from '@/lib/annotations'

export const dynamic = 'force-dynamic'

async function ownedSite(siteId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const site = await prisma.site.findFirst({ where: { id: siteId, userId: session.user.id } })
  if (!site) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  return { site }
}

export async function GET(_req: NextRequest, { params }: { params: { siteId: string } }) {
  const r = await ownedSite(params.siteId)
  if (r.error) return r.error
  const rows = await prisma.annotation.findMany({ where: { siteId: r.site.id }, orderBy: { date: 'desc' }, take: 200 })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: { siteId: string } }) {
  const r = await ownedSite(params.siteId)
  if (r.error) return r.error
  const parsed = parseAnnotation(await req.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const count = await prisma.annotation.count({ where: { siteId: r.site.id } })
  if (count >= MAX_ANNOTATIONS_PER_SITE) {
    return NextResponse.json({ error: `Limit of ${MAX_ANNOTATIONS_PER_SITE} notes reached.` }, { status: 400 })
  }
  const created = await prisma.annotation.create({ data: { siteId: r.site.id, date: parsed.date, text: parsed.text } })
  return NextResponse.json(created, { status: 201 })
}
