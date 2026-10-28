import Link from 'next/link'
import type { Metadata } from 'next'
import { GUIDES } from '@/lib/guides'
import { Logo } from '@/components/Logo'

export const metadata: Metadata = {
  title: 'Analytics guides: AI traffic, rage clicks, GDPR and migration',
  description: 'Practical guides on tracking AI-assistant traffic, finding frustrated users without session recordings, cookieless analytics and GDPR, and migrating from Google Analytics 4.',
  alternates: { canonical: '/guides' },
}

export default function GuidesIndex() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800/60">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="aydex.cloud home"><Logo size={24} tone="on-dark" /></Link>
          <Link href="/auth/signup" className="btn-land-primary text-sm">Start free</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Guides</h1>
        <ul className="mt-8 space-y-4">
          {GUIDES.map((g) => (
            <li key={g.slug} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <Link href={`/guides/${g.slug}`} className="font-semibold text-white hover:text-indigo-300">{g.title}</Link>
              <p className="mt-2 text-sm text-zinc-400">{g.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
