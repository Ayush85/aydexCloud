import { prisma } from './prisma'
import { redis } from './redis'
import { PLANS } from './plans'

/** Pushes a site's monthly pageview cap into Redis so the tracker can enforce it
 *  without needing a Postgres dependency of its own. */
export async function syncSiteQuota(siteId: string): Promise<void> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { user: true },
  })
  if (!site) return

  const limit = PLANS[site.user.planTier].maxPageviews
  try {
    await redis.set(`quota:limit:${site.trackingId}`, Number.isFinite(limit) ? limit : -1)
  } catch {
    // Redis unavailable — the tracker falls back to the Free-tier default limit,
    // and this gets retried on the next plan change / site update, so this is
    // safe to swallow rather than fail the request that triggered the sync.
  }
}

/** Re-syncs every site owned by a user — call after a plan change. */
export async function syncUserQuotas(userId: string): Promise<void> {
  const sites = await prisma.site.findMany({ where: { userId } })
  await Promise.all(sites.map((s) => syncSiteQuota(s.id)))
}

/** Re-syncs every site's cap from the database (source of truth). Run hourly so a plan edited directly in
 *  the database, a flushed Redis, or a missed webhook can never leave a site on the 10,000 Free default. */
export async function syncAllQuotas(): Promise<number> {
  const sites = await prisma.site.findMany({ select: { id: true } })
  for (const s of sites) await syncSiteQuota(s.id)
  return sites.length
}

/** Pageviews counted against this month's cap (includes ones dropped after the cap was hit). */
export async function monthlyUsed(trackingId: string): Promise<number | null> {
  try {
    const ym = new Date().toISOString().slice(0, 7).replace('-', '')
    const v = await redis.get(`quota:used:${trackingId}:${ym}`)
    return v === null ? 0 : Number(v)
  } catch {
    return null
  }
}
