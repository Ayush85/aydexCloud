import Link from 'next/link'
import type { Metadata } from 'next'
import { UtmBuilder } from './UtmBuilder'
import { Logo } from '@/components/Logo'

export const metadata: Metadata = {
  title: 'Free UTM link builder',
  description: 'Build campaign links with utm_source, utm_medium and utm_campaign tags. Runs in your browser; nothing is sent or stored.',
  alternates: { canonical: '/tools/utm-builder' },
}

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="aydex.cloud home"><Logo size={24} tone="on-dark" /></Link>
          <Link href="/auth/signup" className="btn-land-primary text-sm">Start free</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">UTM link builder</h1>
        <p className="mt-3 text-zinc-400">Tag your links so each campaign shows up by name in your analytics. Everything runs in your browser; nothing is sent anywhere.</p>
        <UtmBuilder />
        <section className="mt-12 text-sm text-zinc-400 space-y-3">
          <h2 className="text-xl font-bold text-white">Tips</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Keep names lowercase and consistent. “Email” and “email” are different values in most tools; this builder lowercases for you.</li>
            <li>Source is where the link lives (newsletter, twitter). Medium is the type (email, social, cpc). Campaign is the push (black_friday).</li>
            <li>Do not tag links between pages of your own site; it replaces the real referrer and splits visits.</li>
            <li>aydex.cloud groups tagged visits under Campaigns &amp; Events and counts utm_medium=cpc as Paid and utm_medium=email as Email.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
