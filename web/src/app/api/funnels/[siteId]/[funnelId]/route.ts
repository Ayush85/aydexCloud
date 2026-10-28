import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { siteId: string; funnelId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const site = await prisma.site.findFirst({ where: { id: params.siteId, userId: session.user.id } })
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.funnel.deleteMany({ where: { id: params.funnelId, siteId: site.id } })
  return new NextResponse(null, { status: 204 })
}
