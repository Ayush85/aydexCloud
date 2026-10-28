import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { COMPARISONS, bySlug } from '@/lib/comparisons'
import { SITE_URL, SITE_NAME, CONTENT_UPDATED } from '@/lib/site'
import { JsonLd } from '@/components/JsonLd'
import { Logo } from '@/components/Logo'

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = bySlug(params.slug)
  if (!c) return {}
  const url = `/vs/${c.slug}`
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: url },
    openGraph: { type: 'article', url, title: c.title, description: c.description, siteName: SITE_NAME },
    twitter: { card: 'summary_large_image', title: c.title, description: c.description },
  }
}

export default function ComparisonPage({ params }: { params: { slug: string } }) {
  const c = bySlug(params.slug)
  if (!c) notFound()
  const url = `${SITE_URL}/vs/${c.slug}`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: c.title,
      description: c.description,
      mainEntityOfPage: url,
      dateModified: CONTENT_UPDATED,
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: `vs ${c.name}`, item: url },
      ],
    },
  ]

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200">
      <JsonLd data={jsonLd} />
      <header className="border-b border-zinc-800/60">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="aydex.cloud home"><Logo size={24} tone="on-dark" /></Link>
          <Link href="/auth/signup" className="btn-land-primary text-sm">Start free</Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-4 sm:px-6 py-14 space-y-12">
        <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">Home</Link> / <span>vs {c.name}</span>
        </nav>

        <header>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">{c.title}</h1>
          <p className="mt-4 text-zinc-400 text-lg">{c.intro}</p>
          <p className="mt-3 text-xs text-zinc-500">Last updated <time dateTime={CONTENT_UPDATED}>{CONTENT_UPDATED}</time></p>
        </header>

        <section aria-labelledby="table">
          <h2 id="table" className="text-2xl font-bold text-white mb-4">Side-by-side comparison</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/80 text-zinc-400">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Feature</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-indigo-300">aydex.cloud</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">{c.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {c.rows.map((r) => (
                  <tr key={r.feature} className="align-top">
                    <th scope="row" className="px-4 py-3 text-left font-medium text-zinc-200 w-1/4">{r.feature}</th>
                    <td className="px-4 py-3 text-zinc-300">{r.aydex}</td>
                    <td className="px-4 py-3 text-zinc-400">{r.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Competitor details come from their public documentation and may change; check the sources below.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="text-lg font-bold text-white mb-3">Choose {c.name} if…</h2>
            <ul className="space-y-2 text-sm text-zinc-300 list-disc pl-5">{c.themWins.map((w) => <li key={w}>{w}</li>)}</ul>
          </div>
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5">
            <h2 className="text-lg font-bold text-white mb-3">Choose aydex.cloud if…</h2>
            <ul className="space-y-2 text-sm text-zinc-300 list-disc pl-5">{c.aydexWins.map((w) => <li key={w}>{w}</li>)}</ul>
          </div>
        </section>

        <section aria-labelledby="switch">
          <h2 id="switch" className="text-2xl font-bold text-white mb-4">Trying aydex alongside {c.name}</h2>
          <ol className="space-y-2 text-sm text-zinc-300 list-decimal pl-5">{c.switching.map((s) => <li key={s}>{s}</li>)}</ol>
        </section>

        <section aria-labelledby="faq">
          <h2 id="faq" className="text-2xl font-bold text-white mb-4">Frequently asked questions</h2>
          <dl className="space-y-5">
            {c.faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-white">{f.q}</dt>
                <dd className="mt-1 text-sm text-zinc-400">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">See it on your own site</h2>
          <p className="mt-2 text-zinc-400 text-sm">Free for up to 10,000 pageviews a month. One script tag, no cookies.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/auth/signup" className="btn-land-primary text-sm px-6 py-2.5">Start free</Link>
            <Link href="/privacy-proof" className="btn-land-ghost text-sm px-6 py-2.5">Verify our privacy claims</Link>
          </div>
        </section>

        <footer className="text-xs text-zinc-500 border-t border-zinc-800 pt-6 space-y-1">
          <p>Sources:</p>
          <ul className="space-y-1">
            {c.sources.map((s) => (
              <li key={s.url}><a href={s.url} rel="noopener noreferrer nofollow" target="_blank" className="underline hover:text-zinc-300">{s.label}</a></li>
            ))}
          </ul>
          <p className="pt-2">Also compare: {COMPARISONS.filter((o) => o.slug !== c.slug).map((o) => (
            <Link key={o.slug} href={`/vs/${o.slug}`} className="underline hover:text-zinc-300">aydex vs {o.name}</Link>
          ))}</p>
        </footer>
      </article>
    </main>
  )
}
