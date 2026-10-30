import Link from 'next/link'
import { analyzeScript } from '@/lib/privacyProof'

export const revalidate = 300
export const metadata = {
  title: 'Privacy proof: verify what the tracking script does',
  description: 'Live checks on the exact aydex.cloud tracking script: SHA-256 hash, no cookies, no fingerprinting, no session recording, and exactly which fields leave the browser.',
  alternates: { canonical: '/privacy-proof' },
}

const trackerUrl = process.env.NEXT_PUBLIC_TRACKER_URL ?? 'http://localhost:3001'

async function loadScript(): Promise<string | null> {
  try {
    const res = await fetch(`${trackerUrl}/script.js`, { next: { revalidate: 300 } })
    return res.ok ? await res.text() : null
  } catch {
    return null
  }
}

const SENT = [
  ['s', 'Your site’s tracking id'],
  ['p', 'Page path and query string'],
  ['r', 'Referrer (the server keeps only the host name)'],
  ['w', 'Screen width, to tell phone from desktop'],
  ['e / ep', 'Event name and small JSON properties — only when you call aydex.track() or a behaviour signal fires'],
  ['v', 'Random visitor id — only if you opt in with data-storage'],
]
const NEVER = [
  'Cookies, fingerprints, canvas / audio / WebGL / font probing',
  'Keystrokes, form fields, page text or screenshots — there are no session recordings',
  'Stored IP addresses — the IP is used to derive a daily-rotating hash and a country code and is never written to the analytics database; it only appears in a short-lived rate-limit counter that expires within about a minute',
  'Cross-site identifiers — a visitor on one site can never be matched to another site',
]

export default async function PrivacyProofPage() {
  const js = await loadScript()
  const proof = js ? analyzeScript(js) : null

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14 space-y-10">
        <header>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">← aydex.cloud</Link>
          <h1 className="mt-4 text-3xl font-extrabold text-white">Don’t trust our privacy policy. Check the script.</h1>
          <p className="mt-3 text-zinc-400">
            Everything below is computed live from the exact file your visitors’ browsers download from{' '}
            <code className="text-zinc-300">{trackerUrl}/script.js</code>. No marketing copy — string checks, a hash,
            and the exact fields that leave the browser.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Live checks on the served script</h2>
          {!proof ? (
            <p className="text-amber-400 text-sm">The tracker could not be reached right now, so nothing is shown rather than something stale. Try again shortly.</p>
          ) : (
            <>
              <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/40">
                {proof.checks.map((c) => (
                  <li key={c.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <span className={`mt-0.5 font-bold ${c.pass ? 'text-emerald-400' : 'text-red-400'}`}>{c.pass ? '✓' : '✗'}</span>
                    <div>
                      <div className="text-zinc-200">{c.claim}</div>
                      <div className="text-xs text-zinc-500">{c.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs space-y-2">
                <div className="text-zinc-400">SHA-256 of the served script ({proof.bytes.toLocaleString()} bytes)</div>
                <code className="block break-all text-emerald-300">{proof.sha256}</code>
                <p className="text-zinc-500">Verify it yourself:</p>
                <pre className="overflow-x-auto text-zinc-300">{`curl -s ${trackerUrl}/script.js | sha256sum`}</pre>
                <p className="text-zinc-500">
                  The script is ~{Math.round(proof.bytes / 1024)} KB, unminified and readable. If the hash ever changes,
                  the script changed — pin it with Subresource Integrity if you want to be told.
                </p>
              </div>
            </>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Exactly what leaves the browser</h2>
          <p className="text-sm text-zinc-400">One image or beacon request per event, parameters in the query string:</p>
          <dl className="rounded-xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800 text-sm">
            {SENT.map(([k, v]) => (
              <div key={k} className="flex gap-4 px-4 py-2.5">
                <dt className="w-16 shrink-0 font-mono text-emerald-300">{k}</dt>
                <dd className="text-zinc-300">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-zinc-500">
            Open your browser’s network tab on any tracked site and compare. Behaviour signals (rage clicks, dead clicks,
            JS errors, scroll depth, outbound and download clicks) send a count and a CSS selector or sanitised message,
            nothing else.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">What is never collected</h2>
          <ul className="space-y-2 text-sm text-zinc-300">
            {NEVER.map((n) => (
              <li key={n} className="flex gap-3"><span className="text-emerald-400">✓</span>{n}</li>
            ))}
          </ul>
        </section>

        <section className="text-xs text-zinc-500 border-t border-zinc-800 pt-6 space-y-2">
          <p>
            <strong className="text-zinc-400">Scope of this proof.</strong> The checks above cover what the script can do in a visitor’s
            browser. How the server handles a request (hashing, discarding the IP, retention of two years) is defined in the
            open-source tracker; you can read it and, if you self-host, run it yourself.
          </p>
          <p>Respect Do Not Track by adding <code>data-respect-dnt=&quot;true&quot;</code> to the snippet.</p>
        </section>
      </div>
    </main>
  )
}
