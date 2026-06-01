import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AddSiteButton } from '@/components/AddSiteButton'
import { DeleteSiteButton } from '@/components/DeleteSiteButton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const sites = await prisma.site.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-brand-600">aydex.cloud</Link>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{session.user.email}</span>
            <Link href="/api/auth/signout" className="hover:text-slate-900">Sign out</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My websites</h1>
            <p className="text-slate-500 text-sm mt-1">{sites.length} site{sites.length !== 1 ? 's' : ''} tracked</p>
          </div>
          <AddSiteButton />
        </div>

        {sites.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No sites yet</h2>
            <p className="text-slate-500 text-sm mb-6">
              Add your first website to start tracking analytics.
            </p>
            <AddSiteButton />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <div key={site.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{site.name}</h3>
                    <p className="text-sm text-slate-400">{site.domain}</p>
                  </div>
                  <DeleteSiteButton siteId={site.id} siteName={site.name} />
                </div>
                <Link
                  href={`/dashboard/${site.id}`}
                  className="mt-3 block text-center btn-primary text-sm"
                >
                  View analytics →
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
