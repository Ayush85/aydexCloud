import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ch } from '@/lib/clickhouse'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AddSiteButton } from '@/components/AddSiteButton'
import { DeleteSiteButton } from '@/components/DeleteSiteButton'
import { DashboardHeader } from '@/components/DashboardHeader'
import { Sparkline } from '@/components/Sparkline'
import { PLANS } from '@/lib/plans'

export const dynamic = 'force-dynamic'

function last7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/auth/signin')

  const sites = await prisma.site.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const days = last7Days()
  const dailyBySite = new Map<string, Map<string, number>>()
  let totalViews7d = 0

  if (sites.length > 0) {
    const rs = await ch.query({
      query: `
        SELECT site_id, toDate(timestamp) AS day, count() AS views
        FROM analytics.pageviews
        WHERE site_id IN ({sids:Array(String)})
          AND timestamp >= now() - INTERVAL 7 DAY
          AND event_name = 'pageview'
        GROUP BY site_id, day
      `,
      query_params: { sids: sites.map((s) => s.trackingId) },
      format: 'JSONEachRow',
    })
    const rows = await rs.json<{ site_id: string; day: string; views: number }>()
    for (const row of rows) {
      if (!dailyBySite.has(row.site_id)) dailyBySite.set(row.site_id, new Map())
      dailyBySite.get(row.site_id)!.set(row.day, Number(row.views))
      totalViews7d += Number(row.views)
    }
  }

  const plan = PLANS[user.planTier]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <DashboardHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">My websites</h1>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
              {sites.length} site{sites.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
          <AddSiteButton />
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Sites</p>
            <p className="text-xl font-bold text-slate-900 dark:text-zinc-100">
              {sites.length}{Number.isFinite(plan.maxSites) ? ` / ${plan.maxSites}` : ''}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Pageviews (7d)</p>
            <p className="text-xl font-bold text-slate-900 dark:text-zinc-100">{totalViews7d.toLocaleString()}</p>
          </div>
          <Link href="/dashboard/billing" className="card p-4 hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Plan</p>
            <p className="text-xl font-bold text-slate-900 dark:text-zinc-100">
              {plan.label}
              {user.planTier === 'FREE' && (
                <span className="ml-2 text-xs font-medium text-brand-600 align-middle">Upgrade →</span>
              )}
            </p>
          </Link>
        </div>

        {sites.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 mb-2">No sites yet</h2>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6">
              Add your first website to start tracking analytics.
            </p>
            <AddSiteButton />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => {
              const dailyMap = dailyBySite.get(site.trackingId)
              const sparkData = days.map((d) => dailyMap?.get(d) ?? 0)
              const views7d = sparkData.reduce((a, b) => a + b, 0)

              return (
                <Link
                  key={site.id}
                  href={`/dashboard/${site.id}`}
                  className="card p-5 hover:shadow-md dark:hover:border-zinc-700 transition-all group block"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{site.name}</h3>
                      <p className="text-sm text-slate-400 dark:text-zinc-500 truncate">{site.domain}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      <DeleteSiteButton siteId={site.id} siteName={site.name} />
                    </div>
                  </div>

                  <div className="my-2 -mx-1">
                    <Sparkline data={sparkData} />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400">
                      <span className="font-semibold text-slate-700 dark:text-zinc-200">{views7d.toLocaleString()}</span> views · 7d
                    </span>
                    <span className="text-brand-600 font-medium group-hover:underline">View analytics →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
