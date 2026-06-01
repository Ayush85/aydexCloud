import Link from 'next/link'

const features = [
  {
    icon: '🔒',
    title: 'No cookies, ever',
    desc: 'Fully GDPR & CCPA compliant out of the box. No consent banners required.',
  },
  {
    icon: '⚡',
    title: 'One-line install',
    desc: 'Drop in a single <script> tag. Under 1KB. No performance impact.',
  },
  {
    icon: '📊',
    title: 'Real-time dashboard',
    desc: 'Pageviews, unique visitors, top pages, referrers, devices — all live.',
  },
  {
    icon: '🐳',
    title: 'Self-hostable',
    desc: 'Docker image included. Own your data, run it anywhere.',
  },
  {
    icon: '🔌',
    title: 'REST API',
    desc: 'Query your analytics programmatically. Build on your own data.',
  },
  {
    icon: '🤖',
    title: 'AI Insights (coming)',
    desc: '"Traffic dropped 30% — likely cause: X". Automated anomaly detection.',
  },
]

const plans = [
  { name: 'Free',    price: '$0',  sites: '1 site',        pv: '10k pageviews/mo',    cta: 'Get started' },
  { name: 'Starter', price: '$7',  sites: '3 sites',       pv: '100k pageviews/mo',   cta: 'Start free trial', highlight: true },
  { name: 'Pro',     price: '$19', sites: '10 sites',      pv: '1M pageviews/mo',     cta: 'Start free trial' },
  { name: 'Agency',  price: '$49', sites: 'Unlimited',     pv: '10M pageviews/mo',    cta: 'Contact us' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-brand-600">aydex.cloud</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-sm text-slate-600 hover:text-slate-900">Sign in</Link>
            <Link href="/auth/signup" className="btn-primary text-sm">Get started free</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          <span>🔒</span> Privacy-first • GDPR compliant • Cookie-free
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          Analytics without<br />
          <span className="text-brand-600">violating your users.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          Know where your traffic comes from without collecting personal data,
          setting cookies, or showing consent banners. Simple, fast, compliant.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/signup" className="btn-primary px-8 py-3 text-base">
            Start for free — no card needed
          </Link>
          <Link href="#pricing" className="btn-secondary px-8 py-3 text-base">
            See pricing
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">Free tier forever. Setup in 2 minutes.</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Everything you need. Nothing you don&apos;t.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">Simple pricing</h2>
          <p className="text-center text-slate-500 mb-12">Undercuts every competitor. Cancel anytime.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`card p-6 flex flex-col ${p.highlight ? 'ring-2 ring-brand-500 relative' : ''}`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most popular
                  </span>
                )}
                <div className="text-slate-500 text-sm font-medium mb-1">{p.name}</div>
                <div className="text-4xl font-extrabold text-slate-900 mb-1">{p.price}</div>
                <div className="text-slate-400 text-xs mb-4">/month</div>
                <ul className="text-sm text-slate-600 space-y-1 mb-6 flex-1">
                  <li>✓ {p.sites}</li>
                  <li>✓ {p.pv}</li>
                  <li>✓ GDPR compliant</li>
                  <li>✓ Self-hostable</li>
                </ul>
                <Link
                  href="/auth/signup"
                  className={p.highlight ? 'btn-primary text-center text-sm' : 'btn-secondary text-center text-sm'}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">How we compare</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Product</th>
                <th className="px-4 py-3 text-slate-500 font-medium">Price</th>
                <th className="px-4 py-3 text-slate-500 font-medium">No cookies</th>
                <th className="px-4 py-3 text-slate-500 font-medium">Self-host</th>
                <th className="px-4 py-3 text-slate-500 font-medium">AI insights</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'Google Analytics', price: 'Free*',  cookie: false, self: false, ai: false },
                { name: 'Plausible',        price: '$9+',    cookie: true,  self: true,  ai: false },
                { name: 'Fathom',           price: '$14+',   cookie: true,  self: false, ai: false },
                { name: 'Aydex',            price: '$7+',    cookie: true,  self: true,  ai: true, highlight: true },
              ].map((row) => (
                <tr key={row.name} className={row.highlight ? 'bg-brand-50' : ''}>
                  <td className={`px-6 py-3 font-medium ${row.highlight ? 'text-brand-700' : 'text-slate-900'}`}>
                    {row.name}{row.highlight ? ' ← you' : ''}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{row.price}</td>
                  <td className="px-4 py-3 text-center">{row.cookie ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-center">{row.self ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-center">{row.ai ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 text-center mt-3">*Google Analytics is free because your visitors are the product.</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <p>© 2026 Aydex — Privacy-first analytics. Built by Ayush.</p>
      </footer>
    </div>
  )
}
