import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

export async function PATCH(
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

  const { isPublic } = await req.json()

  // Auto-generate a public token the first time sharing is enabled
  let publicToken = site.publicToken
  if (isPublic && !publicToken) {
    publicToken = randomBytes(14).toString('hex')
  }

  const updated = await prisma.site.update({
    where: { id: params.siteId },
    data: { isPublic, publicToken },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
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

  await prisma.site.delete({ where: { id: params.siteId } })
  return NextResponse.json({ ok: true })
}
