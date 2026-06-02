import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'

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
  const snippet = `<script defer data-site="${site.trackingId}" src="${trackerUrl}/script.js"></script>`

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="font-bold text-brand-600">aydex.cloud</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">{site.name}</span>
          <span className="text-xs text-slate-400 ml-1">{site.domain}</span>
          <div className="ml-auto">
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">← All sites</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <details className="card p-4 mb-6 group">
          <summary className="cursor-pointer text-sm font-medium text-slate-700 select-none">
            📋 Tracking snippet — paste before &lt;/head&gt;
          </summary>
          <div className="mt-3 bg-slate-900 rounded-lg p-3 overflow-x-auto">
            <code className="text-green-400 text-xs font-mono whitespace-nowrap">{snippet}</code>
          </div>
        </details>

        <AnalyticsDashboard
          siteId={site.id}
          siteName={site.name}
          isPublic={site.isPublic}
          publicToken={site.publicToken}
        />
      </main>
    </div>
  )
}
