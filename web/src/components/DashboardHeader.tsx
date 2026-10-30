'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { Logo } from './Logo'

interface Props {
  breadcrumb?: React.ReactNode
}

export function DashboardHeader({ breadcrumb }: Props) {
  const { data: session } = useSession()

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link href="/dashboard" className="shrink-0" aria-label="aydex.cloud dashboard"><Logo size={24} /></Link>
        {breadcrumb && (
          <>
            <span className="text-slate-300 dark:text-zinc-700">/</span>
            {breadcrumb}
          </>
        )}
        <div className="ml-auto flex items-center gap-4 text-sm text-slate-500 dark:text-zinc-400">
          <Link href="/docs" className="hover:text-slate-900 dark:hover:text-zinc-100 hidden sm:inline">Help</Link>
          <Link href="/dashboard/billing" className="hover:text-slate-900 dark:hover:text-zinc-100 hidden sm:inline">Billing</Link>
          <Link href="/dashboard/settings/api-keys" className="hover:text-slate-900 dark:hover:text-zinc-100 hidden sm:inline">API keys</Link>
          <ThemeToggle />
          {session?.user?.email && <span className="hidden md:inline">{session.user.email}</span>}
          <button type="button" onClick={() => signOut({ callbackUrl: '/auth/signin' })} className="hover:text-slate-900 dark:hover:text-zinc-100">Sign out</button>
        </div>
      </div>
    </header>
  )
}
