import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { TrackingSnippet } from '@/components/TrackingSnippet'
import { DashboardHeader } from '@/components/DashboardHeader'

export const dynamic = 'force-dynamic'

export default async function SiteAnalyticsPage({
  params,
}: {
  params: { siteId: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const site = await prisma.site.findFirst({
    where: { id: params.siteId, userId: session.user.id },
  })
  if (!site) notFound()

  const trackerUrl = process.env.NEXT_PUBLIC_TRACKER_URL ?? 'http://localhost:3001'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <DashboardHeader
        breadcrumb={
          <>
            <span className="text-slate-700 dark:text-zinc-200 font-medium">{site.name}</span>
            <span className="text-xs text-slate-400 dark:text-zinc-500 ml-1 hidden sm:inline">{site.domain}</span>
          </>
        }
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <TrackingSnippet
          siteId={site.id}
          trackingId={site.trackingId}
          trackerUrl={trackerUrl}
          initialStorageMode={site.storageMode}
        />

        <AnalyticsDashboard
          siteId={site.id}
          siteName={site.name}
          trackingId={site.trackingId}
          isPublic={site.isPublic}
          publicToken={site.publicToken}
        />
      </main>
    </div>
  )
}
