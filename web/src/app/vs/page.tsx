import Link from 'next/link'
import type { Metadata } from 'next'
import { COMPARISONS } from '@/lib/comparisons'
import { Logo } from '@/components/Logo'

export const metadata: Metadata = {
  title: 'Compare aydex.cloud with other analytics tools',
  description: 'Honest comparisons of aydex.cloud with Google Analytics, Microsoft Clarity, Plausible, Fathom and Umami, including where each one is the better choice.',
  alternates: { canonical: '/vs' },
}

export default function VsIndex() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800/60">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="aydex.cloud home"><Logo size={24} tone="on-dark" /></Link>
          <Link href="/auth/signup" className="btn-land-primary text-sm">Start free</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Compare aydex.cloud</h1>
        <p className="mt-3 text-zinc-400">Every comparison says where the other tool is the better choice.</p>
        <ul className="mt-8 grid sm:grid-cols-2 gap-4">
          {COMPARISONS.map((c) => (
            <li key={c.slug} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <Link href={`/vs/${c.slug}`} className="font-semibold text-white hover:text-indigo-300">aydex.cloud vs {c.name}</Link>
              <p className="mt-2 text-sm text-zinc-400">{c.intro.split('. ')[0]}.</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
