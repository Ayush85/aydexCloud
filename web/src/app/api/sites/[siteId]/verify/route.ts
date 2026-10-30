import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ch } from '@/lib/clickhouse'
import { safeGetHtml, findInstall } from '@/lib/ssrf'
import { overLimit } from '@/lib/security'

export const dynamic = 'force-dynamic'

/** POST: fetch the site's homepage (SSRF-safe) and look for the tracking script; also report recent data. */
export async function POST(_req: NextRequest, { params }: { params: { siteId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const site = await prisma.site.findFirst({ where: { id: params.siteId, userId: session.user.id } })
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (await overLimit(`verify:${session.user.id}`, 20, 600)) {
    return NextResponse.json({ error: 'Too many checks. Try again in a few minutes.' }, { status: 429 })
  }

  let receivedData = false
  try {
    const rs = await ch.query({
      query: `SELECT count() AS n FROM analytics.pageviews WHERE site_id = {sid:String} AND timestamp >= now() - INTERVAL 1 DAY`,
      query_params: { sid: site.trackingId },
      format: 'JSONEachRow',
    })
    receivedData = Number((await rs.json<{ n: number }>())[0]?.n ?? 0) > 0
  } catch { /* leave false */ }

  const r = await safeGetHtml(`https://${site.domain}/`)
  if (!r.ok) {
    return NextResponse.json({
      installed: null, receivedData,
      message: r.error ? `Could not check ${site.domain}: ${r.error}.` : `${site.domain} answered with HTTP ${r.status}, so the page could not be checked.`,
    })
  }
  const f = findInstall(r.body, site.trackingId)
  return NextResponse.json({
    installed: f.found, receivedData,
    message: f.found
      ? receivedData ? 'Script found and data received in the last 24 hours.' : 'Script found on your homepage. Visit your site once to send the first pageview.'
      : f.wrongId ? `A script tag was found but its tracking ID is "${f.wrongId}", not yours. Copy the snippet again from this page.`
      : 'No aydex script tag found on the homepage. It may be added by JavaScript, be on other pages only, or be missing.',
  })
}
