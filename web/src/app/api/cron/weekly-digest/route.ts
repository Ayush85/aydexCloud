import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getInsights } from '@/lib/reports'
import { totals } from '@/lib/stats'
import { sendWeeklyDigest, type SiteDigest } from '@/lib/email'

export const dynamic = 'force-dynamic'

// POST: self-hosted `cron` container (docker-compose). GET: Vercel Cron Jobs,
// which always trigger via GET and auto-attach `Authorization: Bearer
// $CRON_SECRET` when an env var of that exact name is set on the project.
export async function GET(req: NextRequest) {
  return handleWeeklyDigest(req)
}

export async function POST(req: NextRequest) {
  return handleWeeklyDigest(req)
}

async function handleWeeklyDigest(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const header = req.headers.get('authorization') ?? ''
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { emailDigestEnabled: true },
    include: { sites: true },
  })

  let sent = 0
  for (const user of users) {
    if (user.sites.length === 0) continue

    const digests: SiteDigest[] = []
    for (const site of user.sites) {
      try {
        const w = { sid: site.trackingId, days: 7 }
        const [cur, prev, insights] = await Promise.all([
          totals(w),
          totals({ ...w, prev: true }),
          getInsights(site, 7),
        ])
        digests.push({
          name: site.name,
          views: Number(cur.total_views),
          visitors: Number(cur.unique_visitors),
          prevViews: Number(prev.total_views),
          insights: insights.filter((i) => i.kind !== 'note').slice(0, 3).map((i) => i.text),
        })
      } catch (err) {
        // One site's failed query must not stop everyone else's digest.
        console.error('weekly digest: site failed', site.id, err)
        digests.push({ name: site.name, views: 0, visitors: 0 })
      }
    }

    await sendWeeklyDigest(user.email, digests)
    sent++
  }

  return NextResponse.json({ sent })
}
