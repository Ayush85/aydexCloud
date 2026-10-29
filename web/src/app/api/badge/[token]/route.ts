import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ch } from '@/lib/clickhouse'
import { clientIp, overLimit } from '@/lib/security'
import { badgeSvg } from '@/lib/badge'

export const dynamic = 'force-dynamic'

const svg = (body: string, status = 200, maxAge = 3600) =>
  new Response(body, { status, headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`, 'X-Content-Type-Options': 'nosniff' } })

/** Embeddable SVG: unique visitors in the last 7 days. Works only for sites with the public link on. */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  if (await overLimit(`badge:${clientIp(req.headers)}`, 120, 60)) return svg(badgeSvg(null), 429, 60)
  const site = await prisma.site.findFirst({ where: { publicToken: params.token, isPublic: true }, select: { trackingId: true } })
  if (!site) return svg(badgeSvg(null), 404, 300)
  const rs = await ch.query({
    query: `SELECT uniqExact(visitor_hash) AS v FROM analytics.pageviews
            WHERE site_id = {sid:String} AND event_name = 'pageview' AND timestamp >= now() - INTERVAL 7 DAY`,
    query_params: { sid: site.trackingId }, format: 'JSONEachRow',
  })
  return svg(badgeSvg(Number((await rs.json<{ v: number }>())[0]?.v ?? 0)))
}
