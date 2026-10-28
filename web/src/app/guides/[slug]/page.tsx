import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { GUIDES, guideBySlug, type Block } from '@/lib/guides'
import { SITE_URL, SITE_NAME, CONTENT_UPDATED } from '@/lib/site'
import { JsonLd } from '@/components/JsonLd'
import { Logo } from '@/components/Logo'

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = guideBySlug(params.slug)
  if (!g) return {}
  const url = `/guides/${g.slug}`
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: url },
    openGraph: { type: 'article', url, title: g.title, description: g.description, siteName: SITE_NAME },
    twitter: { card: 'summary_large_image', title: g.title, description: g.description },
  }
}

function Render({ b }: { b: Block }) {
  switch (b.t) {
    case 'h2': return <h2 className="text-2xl font-bold text-white mt-10 mb-3">{b.text}</h2>
    case 'p': return <p className="text-zinc-300 leading-relaxed mb-4">{b.text}</p>
    case 'ul': return <ul className="list-disc pl-6 space-y-2 text-zinc-300 mb-4">{b.items.map((i) => <li key={i}>{i}</li>)}</ul>
    case 'ol': return <ol className="list-decimal pl-6 space-y-2 text-zinc-300 mb-4">{b.items.map((i) => <li key={i}>{i}</li>)}</ol>
    case 'code': return <pre className="overflow-x-auto rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-xs text-green-400 mb-4">{b.text}</pre>
  }
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = guideBySlug(params.slug)
  if (!g) notFound()
  const url = `${SITE_URL}/guides/${g.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: g.title,
      description: g.description,
      mainEntityOfPage: url,
      dateModified: CONTENT_UPDATED,
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: g.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
        { '@type': 'ListItem', position: 3, name: g.title, item: url },
      ],
    },
  ]
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200">
      <JsonLd data={jsonLd} />
      <header className="border-b border-zinc-800/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="aydex.cloud home"><Logo size={24} tone="on-dark" /></Link>
          <Link href="/auth/signup" className="btn-land-primary text-sm">Start free</Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
        <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-300">Home</Link> / <Link href="/guides" className="hover:text-zinc-300">Guides</Link>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">{g.title}</h1>
        <p className="mt-4 text-lg text-zinc-400">{g.summary}</p>
        <p className="mt-3 text-xs text-zinc-500">Last updated <time dateTime={CONTENT_UPDATED}>{CONTENT_UPDATED}</time></p>
        <div className="mt-8">{g.blocks.map((b, i) => <Render key={i} b={b} />)}</div>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-white mb-4">Frequently asked questions</h2>
          <dl className="space-y-5">
            {g.faqs.map((f) => (
              <div key={f.q}><dt className="font-semibold text-white">{f.q}</dt><dd className="mt-1 text-sm text-zinc-400">{f.a}</dd></div>
            ))}
          </dl>
        </section>

        <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <h2 className="text-xl font-bold text-white">Try it on your own site</h2>
          <p className="mt-2 text-sm text-zinc-400">Free for up to 10,000 pageviews a month. One script tag, no cookies.</p>
          <Link href="/auth/signup" className="btn-land-primary text-sm px-6 py-2.5 mt-4 inline-block">Start free</Link>
        </section>
      </article>
    </main>
  )
}
