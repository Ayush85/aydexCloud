const COLLECTED = [
  { field: 'Site tracking ID', desc: 'Identifies which of your sites the event belongs to.' },
  { field: 'Page path + query', desc: 'The URL path the visitor is on (e.g. /pricing).' },
  { field: 'Referrer (host only)', desc: 'Just the referring domain (e.g. google.com) — never the full referring URL.' },
  { field: 'Screen width', desc: 'Used only to derive device type (mobile / tablet / desktop).' },
  { field: 'Custom event name + properties', desc: 'Only sent if you call aydex.track() yourself — you control what it contains.' },
]

const NOT_USED = ['Cookies', 'localStorage', 'sessionStorage', 'Fingerprinting scripts']

const WHERE_STORED = [
  { store: 'ClickHouse — analytics.pageviews', detail: 'url, referrer (host only), browser, os, device_type, country, event_name, event_props, visitor_hash, timestamp. Behaviour signals (page time, scroll depth, rage/dead clicks, JS errors, outbound/download clicks) are stored as small counted events — never text, keystrokes or recordings. Auto-deleted after 2 years (TTL).' },
  { store: 'Redis — live:<siteId>', detail: 'Only visitor_hash, in a sorted set with a 15-minute TTL, used for the live-visitor count. Nothing else is kept here.' },
  { store: 'PostgreSQL', detail: 'Your account and site configuration only — no visitor data.' },
]

export function DataStorageInfo() {
  return (
    <div className="mt-4 space-y-6">
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 mb-1">What we collect</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
          Every request to the tracking script sends exactly this, and nothing more:
        </p>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {COLLECTED.map((c) => (
              <tr key={c.field}>
                <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap align-top">{c.field}</td>
                <td className="py-2.5 text-slate-500 dark:text-zinc-400">{c.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 mb-1">What we never use — by default</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
          The tracking script is a stateless image beacon by default — it never touches browser storage.
        </p>
        <div className="flex flex-wrap gap-2">
          {NOT_USED.map((n) => (
            <span key={n} className="inline-flex items-center gap-1.5 text-sm bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg">
              ✓ No {n}
            </span>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 mb-1">Optional: persistent visitor recognition</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          In the tracking snippet settings, you can opt into recognizing repeat visitors across sessions instead of
          the default daily-rotating hash. If you do, a random anonymous ID (no PII) is stored in{' '}
          <code className="bg-slate-100 dark:bg-zinc-800 px-1 rounded">sessionStorage</code> or{' '}
          <code className="bg-slate-100 dark:bg-zinc-800 px-1 rounded">localStorage</code> — your choice — and encrypted there with
          an auto-generated key shown to you once. aydex&apos;s server still only ever receives a one-way hash of
          that ID, never the raw value or the key. That key lives in your own page&apos;s source (so a visitor&apos;s
          browser can decrypt their own ID on their next visit), so it protects the stored value from other scripts
          sharing that browser storage — it is not a secret from your site&apos;s own visitors, who can view page
          source. Sites that leave this on the default &ldquo;Memory only&rdquo; setting are unaffected.
        </p>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 mb-1">How visitors are identified</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          We combine your site ID, today&apos;s date, the visitor&apos;s IP address, and their raw browser
          user-agent string, then SHA-256 hash the result into a <code className="bg-slate-100 dark:bg-zinc-800 px-1 rounded">visitor_hash</code>.
          This hash rotates every day, so the same visitor gets a different hash tomorrow. The raw IP address
          and user-agent are used only for this one calculation and are never written to any database or log.
        </p>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 mb-1">Where it&apos;s stored</h3>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {WHERE_STORED.map((w) => (
              <tr key={w.store}>
                <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap align-top">{w.store}</td>
                <td className="py-2.5 text-slate-500 dark:text-zinc-400">{w.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-5 bg-brand-50/40 dark:bg-brand-500/10">
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 mb-1">Encrypting your own custom event data</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          If you encrypt custom event properties client-side (see the <span className="font-medium">Encryption</span> tab),
          the values stored in <code className="bg-slate-100 dark:bg-zinc-800 px-1 rounded">event_props</code> above are ciphertext —
          even aydex&apos;s own server and database never see the plaintext or your key.
        </p>
      </div>

      <p className="text-xs text-slate-400 dark:text-zinc-500">
        Feel free to copy this page into your own privacy policy — it reflects exactly what the tracker sends and stores today.
      </p>
    </div>
  )
}
