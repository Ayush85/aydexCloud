import { cleanStr, cleanDomain } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { PLANS } from '@/lib/plans'
import { syncSiteQuota } from '@/lib/quota'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sites = await prisma.site.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(sites)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const b = (await req.json().catch(() => null)) as { name?: unknown; domain?: unknown } | null
  const name = cleanStr(b?.name, 1, 100)
  const cleanDom = cleanDomain(b?.domain)
  if (!name || !b?.domain) {
    return NextResponse.json({ error: 'Name and domain are required.' }, { status: 400 })
  }
  if (!cleanDom) {
    return NextResponse.json({ error: 'Enter a valid domain, like example.com.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const siteCount = await prisma.site.count({ where: { userId: session.user.id } })
  const maxSites = PLANS[user!.planTier].maxSites
  if (siteCount >= maxSites) {
    return NextResponse.json(
      { error: `Your ${PLANS[user!.planTier].label} plan allows up to ${maxSites} site(s). Upgrade to add more.` },
      { status: 403 }
    )
  }

  const trackingId = randomBytes(8).toString('hex')

  const site = await prisma.site.create({
    data: {
      userId: session.user.id,
      name,
      domain: cleanDom,
      trackingId,
    },
  })

  await syncSiteQuota(site.id)

  return NextResponse.json(site, { status: 201 })
}
