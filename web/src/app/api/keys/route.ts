import { cleanStr } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomBytes } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashApiKey } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
  })
  return NextResponse.json(keys)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const b = (await req.json().catch(() => null)) as { name?: unknown } | null
  const name = cleanStr(b?.name, 1, 60)
  if (!name) return NextResponse.json({ error: 'Name is required (up to 60 characters).' }, { status: 400 })
  if ((await prisma.apiKey.count({ where: { userId: session.user.id } })) >= 25) {
    return NextResponse.json({ error: 'Limit of 25 API keys reached.' }, { status: 400 })
  }

  const rawKey = `ax_live_${randomBytes(16).toString('hex')}`
  const apiKey = await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      name,
      keyHash: hashApiKey(rawKey),
      keyPrefix: rawKey.slice(0, 16),
    },
  })

  // Raw key is only ever returned here — the DB stores just its hash.
  return NextResponse.json({ id: apiKey.id, name: apiKey.name, key: rawKey }, { status: 201 })
}
