import Link from 'next/link'
import type { Metadata } from 'next'
import { PLANS } from '@/lib/plans'
import { COMPARISONS } from '@/lib/comparisons'
import { FAQS } from '@/lib/faq'
import { SITE_URL, SITE_NAME, CONTENT_UPDATED } from '@/lib/site'
import { JsonLd } from '@/components/JsonLd'
import { Logo } from '@/components/Logo'

export const metadata: Metadata = {
  title: 'What is aydex.cloud? Features, pricing and facts',
  description:
    'aydex.cloud is privacy-first web analytics: cookieless by default, no session recordings, AI-assistant traffic tracking, plain-English traffic explanations, a REST API and an MCP server on every plan.',
  alternates: { canonical: '/about' },
}

const FACTS: [string, string][] = [
  ['Category', 'Web analytics (privacy-first alternative to Google Analytics)'],
  ['Cookies', 'None by default. Optional encrypted visitor ID if the site owner enables it.'],
  ['Session recording', 'None. Behavior signals are counted, never recorded.'],
  ['Visitor counting', 'Daily-rotating hash of site, day, IP and user agent. The IP is not stored in the analytics database.'],
  ['Data retention', 'Automatically deleted after 2 years.'],
  ['Metrics', 'Pageviews, visitors, sessions, bounce rate, time on page, scroll depth, entry/exit pages, channels, referrers, countries, devices, campaigns, goals, funnels, revenue by source.'],
  ['Behavior signals', 'Rage clicks, dead clicks, JavaScript errors, outbound link clicks, file downloads.'],
  ['AI search tracking', 'Visits from ChatGPT, Perplexity, Claude, Gemini, Copilot and similar are reported as their own channel.'],
  ['Insights', 'Rule-based explanations of what accounts for a traffic change versus the previous period.'],
  ['API', 'REST API and an MCP server for AI assistants, on every plan.'],
  ['Import', 'Google Analytics 4 daily CSV import.'],
  ['Hosting', 'Hosted service, or self-host with Docker Compose.'],
]

export default function AboutPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: `What is ${SITE_NAME}?`,
      url: `${SITE_URL}/about`,
      dateModified: CONTENT_UPDATED,
      about: { '@type': 'SoftwareApplication', name: SITE_NAME, url: SITE_URL, applicationCategory: 'BusinessApplication' },
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
        <header>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">What is aydex.cloud?</h1>
          <p className="mt-4 text-lg text-zinc-300">{FAQS[0].a}</p>
          <p className="mt-3 text-xs text-zinc-500">Last updated <time dateTime={CONTENT_UPDATED}>{CONTENT_UPDATED}</time></p>
        </header>

        <section aria-labelledby="facts">
          <h2 id="facts" className="text-2xl font-bold text-white mb-4">Key facts</h2>
          <dl className="rounded-xl border border-zinc-800 divide-y divide-zinc-800 text-sm">
            {FACTS.map(([k, v]) => (
              <div key={k} className="grid sm:grid-cols-[11rem_1fr] gap-1 sm:gap-4 px-4 py-3">
                <dt className="font-medium text-zinc-200">{k}</dt>
                <dd className="text-zinc-400">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="pricing">
          <h2 id="pricing" className="text-2xl font-bold text-white mb-4">Pricing</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/80 text-zinc-400">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Plan</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Price per month</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Websites</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Pageviews per month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {Object.values(PLANS).map((p) => (
                  <tr key={p.tier}>
                    <th scope="row" className="px-4 py-3 text-left font-medium text-zinc-200">{p.label}</th>
                    <td className="px-4 py-3 text-zinc-300">{p.price === 0 ? 'Free' : `$${p.price}`}</td>
                    <td className="px-4 py-3 text-zinc-300">{Number.isFinite(p.maxSites) ? p.maxSites : 'Unlimited'}</td>
                    <td className="px-4 py-3 text-zinc-300">{p.maxPageviews.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="compare">
          <h2 id="compare" className="text-2xl font-bold text-white mb-4">How it compares</h2>
          <ul className="space-y-2 text-sm">
            {COMPARISONS.map((c) => (
              <li key={c.slug}><Link href={`/vs/${c.slug}`} className="text-indigo-300 hover:underline">aydex.cloud vs {c.name}</Link> <span className="text-zinc-500">— {c.intro.split('. ')[0]}.</span></li>
            ))}
            <li><Link href="/privacy-proof" className="text-indigo-300 hover:underline">Privacy proof</Link> <span className="text-zinc-500">— verify the tracking script yourself.</span></li>
          </ul>
        </section>
      </article>
    </main>
  )
}
