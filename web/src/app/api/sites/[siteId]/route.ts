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

  const body = await req.json()
  const data: { isPublic?: boolean; publicToken?: string; storageMode?: string } = {}

  if (typeof body.isPublic === 'boolean') {
    data.isPublic = body.isPublic
    // Auto-generate a public token the first time sharing is enabled
    if (body.isPublic && !site.publicToken) {
      data.publicToken = randomBytes(14).toString('hex')
    }
  }

  if (typeof body.storageMode === 'string') {
    if (!['memory', 'sessionStorage', 'localStorage'].includes(body.storageMode)) {
      return NextResponse.json({ error: 'Invalid storage mode' }, { status: 400 })
    }
    data.storageMode = body.storageMode
  }

  const updated = await prisma.site.update({
    where: { id: params.siteId },
    data,
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
