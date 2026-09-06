import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/plans'
import { ApiKeysPanel } from '@/components/ApiKeysPanel'
import { DashboardHeader } from '@/components/DashboardHeader'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { apiKeys: { orderBy: { createdAt: 'desc' } } },
  })
  if (!user) redirect('/auth/signin')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <DashboardHeader breadcrumb={<span className="text-slate-700 dark:text-zinc-200 font-medium">API keys</span>} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">API keys</h1>
        <p className="text-slate-500 dark:text-zinc-400 text-sm mb-8">
          Use a key with <code className="bg-slate-100 dark:bg-zinc-800 px-1 rounded">Authorization: Bearer &lt;key&gt;</code> against{' '}
          <code className="bg-slate-100 dark:bg-zinc-800 px-1 rounded">/api/v1/stats/&lt;siteId&gt;</code>.
        </p>
        <ApiKeysPanel
          initialKeys={user.apiKeys.map((k) => ({
            id: k.id,
            name: k.name,
            keyPrefix: k.keyPrefix,
            lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
            createdAt: k.createdAt.toISOString(),
          }))}
          apiAccess={PLANS[user.planTier].apiAccess}
        />
      </main>
    </div>
  )
}
