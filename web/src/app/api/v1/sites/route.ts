import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/** GET /api/v1/sites — the sites your key can query. */
export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req)
  if ('response' in auth) return auth.response
  const sites = await prisma.site.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, domain: true },
  })
  return NextResponse.json({ sites })
}
