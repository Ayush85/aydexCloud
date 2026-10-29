import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { JsonLd } from '@/components/JsonLd'
import { FAQS } from '@/lib/faq'
import { PLANS } from '@/lib/plans'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site'

/* ── Icon primitives ─────────────────────────────────────── */
const Shield = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.96 11.96 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)
const Bolt = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)
const Chart = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)
const Server = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a3 3 0 003 3m13.5-3a3 3 0 003 3m-3-3V5.25m0 0a3 3 0 00-3-3H9a3 3 0 00-3 3v5.25m9-5.25H9" />
  </svg>
)
const Code = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
)
const Sparkles = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
)

/* ── Mini dashboard mockup ───────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-2xl">
      {/* glow behind card */}
      <div className="animate-glow absolute inset-x-12 -top-6 h-24 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">
        {/* top bar */}
        <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="ml-3 text-xs text-zinc-500 font-mono">aydex.cloud — dashboard</span>
        </div>

        {/* header row */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.5)]" />
            <span className="text-sm font-medium text-zinc-200">my-saas.com</span>
          </div>
          <div className="flex gap-1 rounded-lg bg-zinc-800 p-1 text-xs">
            {['Today', '7d', '30d'].map((l, i) => (
              <span key={l} className={`px-2.5 py-1 rounded-md ${i === 1 ? 'bg-indigo-600 text-white font-medium' : 'text-zinc-400'}`}>{l}</span>
            ))}
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-3 divide-x divide-zinc-800 border-b border-zinc-800">
          {[
            { label: 'Pageviews',       value: '24,831', delta: '+18.3%' },
            { label: 'Unique visitors', value: '8,204',  delta: '+12.1%' },
            { label: 'Bounce rate',     value: '41.2%',  delta: '−3.4%'  },
          ].map((s) => (
            <div key={s.label} className="px-5 py-4">
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs font-medium text-green-400 mt-0.5">{s.delta}</p>
            </div>
          ))}
        </div>

        {/* chart */}
        <div className="px-5 pt-4 pb-2">
          <svg viewBox="0 0 420 90" className="w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* pageviews */}
            <path d="M0,72 C30,70 45,52 70,48 C95,44 110,58 140,55 C170,52 185,32 210,28 C235,24 250,40 280,36 C310,32 330,14 360,10 C385,7 400,13 420,11" stroke="#6366f1" strokeWidth="2" fill="none" />
            <path d="M0,72 C30,70 45,52 70,48 C95,44 110,58 140,55 C170,52 185,32 210,28 C235,24 250,40 280,36 C310,32 330,14 360,10 C385,7 400,13 420,11 L420,90 L0,90 Z" fill="url(#lg)" />
            {/* visitors */}
            <path d="M0,78 C30,76 45,64 70,60 C95,56 110,68 140,65 C170,62 185,48 210,44 C235,40 250,54 280,50 C310,46 330,34 360,30 C385,27 400,32 420,30" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.7" />
            <path d="M0,78 C30,76 45,64 70,60 C95,56 110,68 140,65 C170,62 185,48 210,44 C235,40 250,54 280,50 C310,46 330,34 360,30 C385,27 400,32 420,30 L420,90 L0,90 Z" fill="url(#lg2)" />
            {/* x-axis labels */}
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
              <text key={d} x={i * 70} y={88} fill="#52525b" fontSize="9" textAnchor="middle">{d}</text>
            ))}
          </svg>
        </div>

        {/* bottom row */}
        <div className="grid grid-cols-2 divide-x divide-zinc-800 border-t border-zinc-800">
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-zinc-400 mb-3">Top pages</p>
            {[
              { page: '/blog/analytics', pct: 78 },
              { page: '/pricing',        pct: 42 },
              { page: '/docs',           pct: 24 },
            ].map((r) => (
              <div key={r.page} className="flex items-center gap-2 mb-2">
                <div className="flex-1 text-xs text-zinc-300 truncate">{r.page}</div>
                <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-zinc-400 mb-3">Sources</p>
            {[
              { ref: 'google.com',   pct: 64 },
              { ref: 'twitter.com',  pct: 38 },
              { ref: 'Direct',       pct: 22 },
            ].map((r) => (
              <div key={r.ref} className="flex items-center gap-2 mb-2">
                <div className="flex-1 text-xs text-zinc-300 truncate">{r.ref}</div>
                <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Feature data ────────────────────────────────────────── */
const features = [
  {
    icon: <Shield />,
    color: 'bg-indigo-500/10 text-indigo-400',
    title: 'Zero cookies. Ever.',
    desc: 'Fully GDPR & CCPA compliant out of the box. No consent banners, no cookie popups — ever.',
  },
  {
    icon: <Bolt />,
    color: 'bg-amber-500/10 text-amber-400',
    title: 'One-line install',
    desc: 'A single <script> tag under 1KB. Loads async, deferred, and never blocks your page.',
  },
  {
    icon: <Chart />,
    color: 'bg-green-500/10 text-green-400',
    title: 'Real-time dashboard',
    desc: 'Pageviews, unique visitors, top pages, referrers, device types — all updated live.',
  },
  {
    icon: <Server />,
    color: 'bg-sky-500/10 text-sky-400',
    title: 'Self-hostable',
    desc: 'Docker image included. Own your data, run it on your own infra, no vendor lock-in.',
  },
  {
    icon: <Code />,
    color: 'bg-violet-500/10 text-violet-400',
    title: 'REST API + MCP on every plan',
    desc: 'Query your analytics programmatically, or ask Claude about your traffic through the MCP server.',
  },
  {
    icon: <Sparkles />,
    color: 'bg-rose-500/10 text-rose-400',
    title: 'Why-it-changed insights',
    desc: 'Plain-English explanations of what accounts for a traffic change, with numbers you can verify.',
  },
]

/* ── Pricing data ────────────────────────────────────────── */
const plans = [
  {
    name: 'Free',
    tier: null,
    price: '$0',
    sites: '1 website',
    pv: '10,000 pageviews/mo',
    features: ['Real-time dashboard', 'Cookieless tracking', 'REST API + MCP server', 'Community support'],
    cta: 'Start for free',
    highlight: false,
  },
  {
    name: 'Starter',
    tier: 'STARTER',
    price: '$7',
    sites: '3 websites',
    pv: '100,000 pageviews/mo',
    features: ['Everything in Free', 'Email reports', 'GDPR badge', 'Email support'],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Pro',
    tier: 'PRO',
    price: '$19',
    sites: '10 websites',
    pv: '1,000,000 pageviews/mo',
    features: ['Everything in Starter', 'Custom events', 'Traffic alerts', 'Priority email support'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Agency',
    tier: 'AGENCY',
    price: '$49',
    sites: 'Unlimited',
    pv: '10,000,000 pageviews/mo',
    features: ['Everything in Pro', 'White-label option', 'Team seats', 'Priority support'],
    cta: 'Contact us',
    highlight: false,
  },
]

/* ── Page ────────────────────────────────────────────────── */
const landingJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: SITE_DESCRIPTION,
    offers: Object.values(PLANS).map((p) => ({
      '@type': 'Offer',
      name: p.label,
      price: String(p.price),
      priceCurrency: 'USD',
      url: `${SITE_URL}/#pricing`,
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">
      <JsonLd data={landingJsonLd} />

      {/* ── Nav ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Logo size={28} tone="on-dark" />
            <div className="hidden items-center gap-6 text-sm text-zinc-400 sm:flex">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing"  className="hover:text-white transition-colors">Pricing</a>
              <Link href="/auth/signin" className="hover:text-white transition-colors">Docs</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="hidden text-sm text-zinc-400 hover:text-white transition-colors sm:block">
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-land-primary text-sm">
              Get started free
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-24 pt-20 text-center">
        {/* dot grid */}
        <div className="dot-grid absolute inset-0 pointer-events-none opacity-40" />
        {/* radial glow */}
        <div className="animate-glow pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-indigo-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          {/* badge */}
          <div className="animate-fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-medium text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_2px_rgba(129,140,248,0.6)]" />
            Open source · GDPR compliant · Cookie-free
          </div>

          {/* headline */}
          <h1 className="animate-fade-up-2 mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Analytics that<br />
            <span className="grad-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">
              respect your users.
            </span>
          </h1>

          <p className="animate-fade-up-3 mx-auto mb-10 max-w-xl text-lg leading-relaxed text-zinc-400">
            Know exactly where your traffic comes from — without cookies,
            without consent banners, and without sending data to Google.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-3 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/signup" className="btn-land-primary px-6 py-3 text-sm shadow-glow-sm">
              Start free — no card needed →
            </Link>
            <a href="#features" className="btn-land-ghost px-6 py-3 text-sm">
              See how it works
            </a>
          </div>

          {/* stats */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm">
            {[
              { value: '0',      label: 'cookies set' },
              { value: '<1 KB',  label: 'script size' },
              { value: '100%',   label: 'GDPR compliant' },
              { value: 'Free',   label: 'tier forever' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="font-bold text-white">{s.value}</span>
                <span className="text-zinc-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard preview ─────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-28 sm:px-6">
        <DashboardMockup />
      </section>

      {/* ── Marquee strip ─────────────────────────────────── */}
      <div className="border-y border-zinc-800/60 bg-zinc-900/40 py-3 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <div className="animate-marquee flex shrink-0 gap-12 pr-12 text-xs font-medium text-zinc-500 uppercase tracking-widest">
            {Array(2).fill(['No cookies', 'No personal data', 'GDPR compliant', 'CCPA compliant', 'Self-hostable', 'Open source', 'Real-time', 'Cookie-free', 'Privacy first']).flat().map((t, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="h-1 w-1 rounded-full bg-indigo-500" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">Features</p>
          <h2 className="text-4xl font-bold tracking-tight">
            Everything you need.{' '}
            <span className="grad-text bg-gradient-to-r from-zinc-400 to-zinc-600">Nothing you don&apos;t.</span>
          </h2>
          <p className="mt-4 text-zinc-400">Built for indie developers, agencies, and privacy-conscious teams.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              {/* subtle glow on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ background: 'radial-gradient(400px at 50% 0%, rgba(99,102,241,0.06), transparent)' }} />
              <div className={`feature-icon mb-4 ${f.color}`}>{f.icon}</div>
              <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── One-line install ──────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 pb-28 sm:px-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-10 sm:p-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-green-400">Setup</p>
          <h2 className="mb-3 text-3xl font-bold">One line. That&apos;s it.</h2>
          <p className="mb-10 text-zinc-400">Paste this before your closing <code className="text-zinc-300">&lt;/head&gt;</code> tag. Done.</p>

          {/* Code block */}
          <div className="relative rounded-xl border border-zinc-700/60 bg-zinc-950 text-left overflow-x-auto">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="ml-2 text-xs text-zinc-600 font-mono">index.html</span>
            </div>
            <div className="px-5 py-4 font-mono text-sm leading-relaxed">
              <span className="text-zinc-600">&lt;!-- Add before &lt;/head&gt; --&gt;</span>
              <br />
              <span className="text-violet-400">&lt;script</span>
              <span className="text-sky-400"> defer</span>
              <span className="text-emerald-400"> data-site</span>
              <span className="text-zinc-400">=</span>
              <span className="text-amber-300">&quot;YOUR_SITE_ID&quot;</span>
              <span className="text-emerald-400"> src</span>
              <span className="text-zinc-400">=</span>
              <span className="text-amber-300">&quot;https://aydex.cloud/script.js&quot;</span>
              <span className="text-violet-400">&gt;&lt;/script&gt;</span>
            </div>
          </div>

          <p className="mt-6 text-sm text-zinc-500">
            Works with any framework — Next.js, React, Vue, plain HTML, WordPress, Webflow.
          </p>
        </div>
      </section>

      {/* ── Comparison ────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 pb-28 sm:px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Compare</p>
          <h2 className="text-3xl font-bold">How we stack up</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-6 py-3.5 text-left text-zinc-400 font-medium">Product</th>
                <th className="px-4 py-3.5 text-center text-zinc-400 font-medium">Price/mo</th>
                <th className="px-4 py-3.5 text-center text-zinc-400 font-medium">Cookie-free</th>
                <th className="px-4 py-3.5 text-center text-zinc-400 font-medium">Self-host</th>
                <th className="px-4 py-3.5 text-center text-zinc-400 font-medium">AI insights</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Google Analytics', price: 'Free*', cookie: false, self: false, ai: false, you: false },
                { name: 'Plausible',        price: '$9+',   cookie: true,  self: true,  ai: false, you: false },
                { name: 'Fathom',           price: '$14+',  cookie: true,  self: false, ai: false, you: false },
                { name: 'Aydex',            price: '$7+',   cookie: true,  self: true,  ai: true,  you: true  },
              ].map((row, i) => (
                <tr
                  key={row.name}
                  className={`border-b border-zinc-800 last:border-0 transition-colors ${
                    row.you ? 'bg-indigo-500/8' : 'hover:bg-zinc-900/50'
                  }`}
                >
                  <td className="px-6 py-3.5">
                    <span className={`font-medium ${row.you ? 'text-indigo-300' : 'text-zinc-200'}`}>
                      {row.name}
                    </span>
                    {row.you && (
                      <span className="ml-2 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-400 font-medium">
                        you
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3.5 text-center ${row.you ? 'font-semibold text-white' : 'text-zinc-400'}`}>
                    {row.price}
                  </td>
                  <td className="px-4 py-3.5 text-center text-base">{row.cookie ? '✅' : '❌'}</td>
                  <td className="px-4 py-3.5 text-center text-base">{row.self   ? '✅' : '❌'}</td>
                  <td className="px-4 py-3.5 text-center text-base">{row.ai     ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-xs text-zinc-600">
          *Google Analytics is &ldquo;free&rdquo; because your visitors are the product.
        </p>
      </section>

      {/* ── Pricing ───────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Pricing</p>
          <h2 className="text-4xl font-bold">Simple, honest pricing.</h2>
          <p className="mt-3 text-zinc-400">Undercuts every competitor. Cancel anytime. No surprises.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                p.highlight
                  ? 'border-indigo-500/60 bg-indigo-500/8 shadow-glow-sm'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-glow-sm">
                    Most popular
                  </span>
                </div>
              )}
              <div className="mb-1 text-sm font-medium text-zinc-400">{p.name}</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">{p.price}</span>
              </div>
              <div className="mb-1 text-xs text-zinc-600">/month · billed monthly</div>
              <div className="mb-4 text-xs text-zinc-500">{p.sites} · {p.pv}</div>

              <ul className="flex-1 space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={p.tier ? `/auth/signup?plan=${p.tier.toLowerCase()}` : '/auth/signup'}
                className={`block rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
                  p.highlight
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-glow-sm'
                    : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl px-4 pb-28 sm:px-6" aria-labelledby="faq-title">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">FAQ</p>
          <h2 id="faq-title" className="text-3xl font-bold">Questions, answered straight</h2>
        </div>
        <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-6 py-4">
              <summary className="cursor-pointer list-none font-medium text-zinc-100 flex justify-between gap-4">
                {f.q}
                <span className="text-zinc-500 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-2 text-sm text-zinc-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-14 text-center">
          {/* noise texture */}
          <div className="pointer-events-none absolute inset-0 opacity-20"
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />
          <div className="relative">
            <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
              Ready to ditch Google Analytics?
            </h2>
            <p className="mb-8 text-lg text-indigo-100 max-w-lg mx-auto">
              Join hundreds of developers who already ship with a clean conscience.
              Free tier, no card required.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-indigo-700 shadow-lg hover:bg-indigo-50 transition-colors"
            >
              Start for free today →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/60 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={24} tone="on-dark" />
          <div className="flex gap-6 text-sm text-zinc-500">
            <a href="#features" className="hover:text-zinc-300 transition-colors">Features</a>
            <a href="#pricing"  className="hover:text-zinc-300 transition-colors">Pricing</a>
            <Link href="/about" className="hover:text-zinc-300 transition-colors">About</Link>
            <Link href="/vs" className="hover:text-zinc-300 transition-colors">Compare</Link>
            <Link href="/docs" className="hover:text-zinc-300 transition-colors">User guide</Link>
            <Link href="/guides" className="hover:text-zinc-300 transition-colors">Guides</Link>
            <Link href="/tools/utm-builder" className="hover:text-zinc-300 transition-colors">UTM builder</Link>
            <Link href="/privacy-proof" className="hover:text-zinc-300 transition-colors">Privacy proof</Link>
            <Link href="/auth/signup" className="hover:text-zinc-300 transition-colors">Sign up</Link>
          </div>
          <p className="text-xs text-zinc-600">© 2026 Aydex. Privacy-first analytics. Built by Ayush.</p>
        </div>
      </footer>

    </div>
  )
}
