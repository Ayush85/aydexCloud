import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { postWebhook } from '@/lib/webhook'

export const dynamic = 'force-dynamic'

/** Sends a test message to the site's saved webhook. */
export async function POST(_req: NextRequest, { params }: { params: { siteId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const site = await prisma.site.findFirst({ where: { id: params.siteId, userId: session.user.id } })
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!site.webhookUrl) return NextResponse.json({ error: 'No webhook saved.' }, { status: 400 })
  const ok = await postWebhook(site.webhookUrl, `aydex.cloud test: notifications for ${site.name} are working.`)
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'The webhook did not accept the message.' }, { status: 502 })
}
