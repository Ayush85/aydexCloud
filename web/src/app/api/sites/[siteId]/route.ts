import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { PLANS } from '@/lib/plans'
import { webhookKind, maskWebhook } from '@/lib/webhook'

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

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  const data: {
    isPublic?: boolean; publicToken?: string; storageMode?: string
    alertsEnabled?: boolean; webhookUrl?: string | null
  } = {}

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

  if (typeof body.alertsEnabled === 'boolean') {
    if (body.alertsEnabled) {
      const owner = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!owner || !PLANS[owner.planTier].alerts) {
        return NextResponse.json({ error: 'Traffic alerts are included on the Pro and Agency plans.' }, { status: 403 })
      }
    }
    data.alertsEnabled = body.alertsEnabled
  }

  if (typeof body.webhookUrl === 'string') {
    const url = body.webhookUrl.trim()
    if (url === '') data.webhookUrl = null
    else if (webhookKind(url)) data.webhookUrl = url
    else return NextResponse.json({ error: 'Use a Slack or Discord incoming-webhook URL (https).' }, { status: 400 })
  }

  const updated = await prisma.site.update({
    where: { id: params.siteId },
    data,
  })

  const { webhookUrl, ...safe } = updated
  return NextResponse.json({ ...safe, webhook: webhookUrl ? maskWebhook(webhookUrl) : null })
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
