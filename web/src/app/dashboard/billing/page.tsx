import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ch } from '@/lib/clickhouse'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/plans'
import { BillingPanel } from '@/components/BillingPanel'
import { DashboardHeader } from '@/components/DashboardHeader'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { sites: true },
  })
  if (!user) redirect('/auth/signin')

  const limits = PLANS[user.planTier]

  let pageviewsUsed = 0
  if (user.sites.length > 0) {
    const rs = await ch.query({
      query: `
        SELECT count() AS views
        FROM analytics.pageviews
        WHERE site_id IN ({sids:Array(String)})
          AND timestamp >= toStartOfMonth(now())
          AND event_name = 'pageview'
      `,
      query_params: { sids: user.sites.map((s) => s.trackingId) },
      format: 'JSONEachRow',
    })
    const [row] = await rs.json<{ views: number }>()
    pageviewsUsed = row?.views ?? 0
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <DashboardHeader breadcrumb={<span className="text-slate-700 dark:text-zinc-200 font-medium">Billing</span>} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-8">Billing & plan</h1>
        <BillingPanel
          planTier={user.planTier}
          hasStripeCustomer={Boolean(user.stripeCustomerId)}
          emailDigestEnabled={user.emailDigestEnabled}
          usage={{ sitesUsed: user.sites.length, pageviewsUsed }}
          limits={{ maxSites: limits.maxSites, maxPageviews: limits.maxPageviews }}
        />
      </main>
    </div>
  )
}
