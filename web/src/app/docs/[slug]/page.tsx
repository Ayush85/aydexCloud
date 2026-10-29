import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { DOCS, DOC_GROUPS, docBySlug, type DocBlock } from '@/lib/docs'
import { SITE_URL, SITE_NAME, CONTENT_UPDATED } from '@/lib/site'
import { JsonLd } from '@/components/JsonLd'
import { Logo } from '@/components/Logo'

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const d = docBySlug(params.slug)
  if (!d) return {}
  const url = `/docs/${d.slug}`
  return {
    title: d.title,
    description: d.description,
    alternates: { canonical: url },
    openGraph: { type: 'article', url, title: d.title, description: d.description, siteName: SITE_NAME },
  }
}

function Render({ b }: { b: DocBlock }) {
  switch (b.t) {
    case 'h2': return <h2 className="text-xl font-bold text-white mt-9 mb-3">{b.text}</h2>
    case 'p': return <p className="text-zinc-300 leading-relaxed mb-4">{b.text}</p>
    case 'ul': return <ul className="list-disc pl-6 space-y-2 text-zinc-300 mb-4">{b.items.map((i) => <li key={i}>{i}</li>)}</ul>
    case 'ol': return <ol className="list-decimal pl-6 space-y-2 text-zinc-300 mb-4">{b.items.map((i) => <li key={i}>{i}</li>)}</ol>
    case 'code': return <pre className="overflow-x-auto rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-xs text-green-400 mb-4 whitespace-pre-wrap break-words">{b.text}</pre>
    case 'table': return (
      <div className="overflow-x-auto mb-5">
        <table className="w-full text-sm text-left border border-zinc-800">
          <thead className="bg-zinc-900 text-zinc-300"><tr>{b.head.map((h) => <th key={h} className="px-3 py-2 font-semibold border-b border-zinc-800">{h}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, i) => <tr key={i} className="border-b border-zinc-800/70 align-top">{r.map((c, j) => <td key={j} className={`px-3 py-2 ${j === 0 ? 'font-medium text-white whitespace-nowrap' : 'text-zinc-300'}`}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    )
  }
}

export default function DocPage({ params }: { params: { slug: string } }) {
  const d = docBySlug(params.slug)
  if (!d) notFound()
  const i = DOCS.findIndex((x) => x.slug === d.slug)
  const prev = DOCS[i - 1], next = DOCS[i + 1]
  const url = `${SITE_URL}/docs/${d.slug}`
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'TechArticle', headline: d.title, description: d.description, mainEntityOfPage: url, dateModified: CONTENT_UPDATED,
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'User guide', item: `${SITE_URL}/docs` },
      { '@type': 'ListItem', position: 3, name: d.title, item: url } ] },
  ]
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200">
      <JsonLd data={jsonLd} />
      <header className="border-b border-zinc-800/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="aydex.cloud home"><Logo size={24} tone="on-dark" /></Link>
          <Link href="/auth/signup" className="btn-land-primary text-sm">Start free</Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-10">
        <nav aria-label="User guide" className="mb-8 lg:mb-0 lg:sticky lg:top-6 lg:self-start text-sm">
          <Link href="/docs" className="font-semibold text-white">User guide</Link>
          {DOC_GROUPS.map((g) => (
            <div key={g} className="mt-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{g}</p>
              <ul className="mt-1 space-y-1">
                {DOCS.filter((x) => x.group === g).map((x) => (
                  <li key={x.slug}><Link href={`/docs/${x.slug}`} aria-current={x.slug === d.slug ? 'page' : undefined}
                    className={x.slug === d.slug ? 'text-brand-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'}>{x.title}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <article className="min-w-0">
          <h1 className="text-3xl font-extrabold text-white leading-tight">{d.title}</h1>
          <p className="mt-3 text-zinc-400">{d.description}</p>
          <div className="mt-6">{d.blocks.map((b, k) => <Render key={k} b={b} />)}</div>
          <div className="mt-12 flex justify-between gap-4 text-sm border-t border-zinc-800 pt-5">
            {prev ? <Link href={`/docs/${prev.slug}`} className="text-brand-400 hover:underline">← {prev.title}</Link> : <span />}
            {next ? <Link href={`/docs/${next.slug}`} className="text-brand-400 hover:underline">{next.title} →</Link> : <span />}
          </div>
        </article>
      </div>
    </main>
  )
}
