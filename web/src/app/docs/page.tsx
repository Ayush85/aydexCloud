import Link from 'next/link'
import type { Metadata } from 'next'
import { DOCS, DOC_GROUPS } from '@/lib/docs'
import { Logo } from '@/components/Logo'

export const metadata: Metadata = {
  title: 'User guide',
  description: 'How to install aydex.cloud, read every part of the dashboard, track goals, funnels and revenue, set up alerts, and use the API and MCP server.',
  alternates: { canonical: '/docs' },
}

export default function DocsIndex() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800/60">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="aydex.cloud home"><Logo size={24} tone="on-dark" /></Link>
          <Link href="/auth/signup" className="btn-land-primary text-sm">Start free</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">User guide</h1>
        <p className="mt-3 text-zinc-400">Everything you need to set up and get value from aydex.cloud.</p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {DOC_GROUPS.map((g) => (
            <section key={g}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{g}</h2>
              <ul className="mt-3 space-y-3">
                {DOCS.filter((d) => d.group === g).map((d) => (
                  <li key={d.slug}>
                    <Link href={`/docs/${d.slug}`} className="font-medium text-white hover:text-brand-400">{d.title}</Link>
                    <p className="text-sm text-zinc-500">{d.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-12 text-sm text-zinc-500">
          Tools: <Link href="/tools/utm-builder" className="text-brand-400 hover:underline">UTM link builder</Link> · More: <Link href="/guides" className="text-brand-400 hover:underline">Guides</Link>
        </p>
      </div>
    </main>
  )
}
