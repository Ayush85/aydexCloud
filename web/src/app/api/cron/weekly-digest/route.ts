import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ch } from '@/lib/clickhouse'
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
      const rs = await ch.query({
        query: `
          SELECT count() AS views, uniqExact(visitor_hash) AS visitors
          FROM analytics.pageviews
          WHERE site_id = {sid:String} AND timestamp >= now() - INTERVAL 7 DAY AND event_name = 'pageview'
        `,
        query_params: { sid: site.trackingId },
        format: 'JSONEachRow',
      })
      const [row] = await rs.json<{ views: number; visitors: number }>()
      digests.push({ name: site.name, views: row?.views ?? 0, visitors: row?.visitors ?? 0 })
    }

    await sendWeeklyDigest(user.email, digests)
    sent++
  }

  return NextResponse.json({ sent })
}
