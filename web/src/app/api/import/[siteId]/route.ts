import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ch } from '@/lib/clickhouse'
import { validateRows } from '@/lib/csvImport'

export const dynamic = 'force-dynamic'

async function ownedSite(siteId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const site = await prisma.site.findFirst({ where: { id: siteId, userId: session.user.id } })
  if (!site) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  return { site }
}

const DDL = `
  CREATE TABLE IF NOT EXISTS analytics.imported_daily
  (
    site_id     String,
    date        Date,
    source      LowCardinality(String) DEFAULT 'ga4',
    pageviews   UInt64,
    visitors    UInt64,
    sessions    UInt64 DEFAULT 0,
    imported_at DateTime DEFAULT now()
  )
  ENGINE = ReplacingMergeTree(imported_at)
  ORDER BY (site_id, date, source)`

/** How many imported days this site has (and their range). */
export async function GET(_req: NextRequest, { params }: { params: { siteId: string } }) {
  const r = await ownedSite(params.siteId)
  if (r.error) return r.error
  try {
    const rs = await ch.query({
      query: `SELECT count() AS days, toString(min(date)) AS first, toString(max(date)) AS last
              FROM (SELECT date FROM analytics.imported_daily FINAL WHERE site_id = {sid:String} GROUP BY date)`,
      query_params: { sid: r.site.trackingId },
      format: 'JSONEachRow',
    })
    const [row] = await rs.json<{ days: string | number; first: string; last: string }>()
    return NextResponse.json({ days: Number(row?.days ?? 0), first: row?.first ?? null, last: row?.last ?? null })
  } catch {
    return NextResponse.json({ days: 0, first: null, last: null })
  }
}

/** Body: { rows: [{ date: "YYYY-MM-DD", pageviews, visitors, sessions? }] } — parsed from the CSV in the browser. */
export async function POST(req: NextRequest, { params }: { params: { siteId: string } }) {
  const r = await ownedSite(params.siteId)
  if (r.error) return r.error
  const body = await req.json().catch(() => null)
  const rows = validateRows(body?.rows)
  if (!rows) {
    return NextResponse.json({ error: 'Invalid rows. Expected 1–5000 unique days with non-negative integer counts.' }, { status: 400 })
  }
  await ch.command({ query: DDL })
  await ch.insert({
    table: 'analytics.imported_daily',
    format: 'JSONEachRow',
    values: rows.map((x) => ({
      site_id: r.site.trackingId,
      date: x.date,
      source: 'ga4',
      pageviews: x.pageviews,
      visitors: x.visitors,
      sessions: x.sessions,
    })),
  })
  return NextResponse.json({ imported: rows.length, first: rows[0].date, last: rows[rows.length - 1].date }, { status: 201 })
}

export async function DELETE(_req: NextRequest, { params }: { params: { siteId: string } }) {
  const r = await ownedSite(params.siteId)
  if (r.error) return r.error
  // Mutations don't reliably accept bound parameters, so inline the id — but only
  // after proving it is the 16-hex string we generated at site creation.
  if (!/^[a-f0-9]{16}$/.test(r.site.trackingId)) {
    return NextResponse.json({ error: 'Unexpected tracking id format' }, { status: 500 })
  }
  await ch.command({
    query: `ALTER TABLE analytics.imported_daily DELETE WHERE site_id = '${r.site.trackingId}'`,
  })
  return new NextResponse(null, { status: 204 })
}
