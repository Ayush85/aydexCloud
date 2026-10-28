import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as { enabled?: unknown } | null
  if (typeof body?.enabled !== 'boolean') return NextResponse.json({ error: 'enabled must be true or false.' }, { status: 400 })
  const enabled = body.enabled
  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailDigestEnabled: enabled },
  })

  return NextResponse.json({ ok: true })
}
