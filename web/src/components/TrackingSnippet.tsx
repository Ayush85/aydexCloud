'use client'

import { useState } from 'react'

interface Props {
  siteId: string
  trackingId: string
  trackerUrl: string
  initialStorageMode: string
}

const STORAGE_OPTIONS = [
  { value: 'memory', label: 'Memory only (default) — no client-side storage' },
  { value: 'sessionStorage', label: 'sessionStorage — persists until the tab closes' },
  { value: 'localStorage', label: 'localStorage — persists until explicitly cleared' },
]

function randomKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

type ProxyKind = 'nginx' | 'next' | 'caddy'

function proxyConfig(kind: ProxyKind, trackerUrl: string): string {
  if (kind === 'nginx')
    return `location /stats/ {
    proxy_pass ${trackerUrl}/;
    proxy_set_header Host $proxy_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header User-Agent $http_user_agent;
}`
  if (kind === 'caddy')
    return `handle_path /stats/* {
    reverse_proxy ${trackerUrl} {
        header_up X-Real-IP {remote_host}
    }
}`
  return `// next.config.js
module.exports = {
  async rewrites() {
    return [{ source: '/stats/:path*', destination: '${trackerUrl}/:path*' }]
  },
}`
}

export function TrackingSnippet({ siteId, trackingId, trackerUrl, initialStorageMode }: Props) {
  const [storageMode, setStorageMode] = useState(initialStorageMode)
  const [key, setKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [proxy, setProxy] = useState<ProxyKind>('nginx')

  async function handleModeChange(mode: string) {
    setStorageMode(mode)
    if (mode !== 'memory' && !key) setKey(randomKey())

    setSaving(true)
    try {
      await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageMode: mode }),
      })
    } finally {
      setSaving(false)
    }
  }

  function regenerateKey() {
    setKey(randomKey())
  }

  const attrs = [`data-site="${trackingId}"`]
  if (storageMode !== 'memory') {
    attrs.push(`data-storage="${storageMode}"`)
    if (key) attrs.push(`data-key="${key}"`)
  }
  const snippet = `<script defer ${attrs.join(' ')} src="${trackerUrl}/script.js"></script>`

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card p-4 mb-6 space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">📋 Tracking snippet — paste before &lt;/head&gt;</p>
        <div className="mt-1 bg-slate-900 dark:bg-black rounded-lg p-3 overflow-x-auto flex items-start justify-between gap-3">
          <code className="text-green-400 text-xs font-mono whitespace-pre-wrap break-all">{snippet}</code>
          <button onClick={copySnippet} className="shrink-0 text-xs text-slate-300 hover:text-white">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 block mb-1">
          Persistent visitor ID storage {saving && <span className="text-xs text-slate-400 dark:text-zinc-500">(saving…)</span>}
        </label>
        <select
          className="input"
          value={storageMode}
          onChange={(e) => handleModeChange(e.target.value)}
        >
          {STORAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
          Memory only means every visit looks like a new visitor (today&apos;s default). Choosing a persistent
          option recognizes repeat visitors across sessions, encrypted with the key below.
        </p>
      </div>

      <details className="rounded-lg border border-slate-200 dark:border-zinc-800 p-3 text-sm">
        <summary className="cursor-pointer font-medium text-slate-700 dark:text-zinc-300">
          Get past ad blockers — serve the tracker from your own domain
        </summary>
        <div className="mt-3 space-y-3 text-xs text-slate-500 dark:text-zinc-400">
          <p>
            Blockers match third-party tracker domains. Proxy aydex through a path on your own site and the script
            and events become first-party requests. Pick your server, add the rule, then use the snippet below.
          </p>
          <div className="flex gap-2">
            {(['nginx', 'caddy', 'next'] as ProxyKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setProxy(k)}
                className={`px-2.5 py-1 rounded-md border text-xs ${proxy === k ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-200 dark:border-zinc-700'}`}
              >
                {k === 'next' ? 'Next.js' : k}
              </button>
            ))}
          </div>
          <pre className="bg-slate-900 text-green-400 rounded-lg p-3 overflow-x-auto font-mono">{proxyConfig(proxy, trackerUrl)}</pre>
          <pre className="bg-slate-900 text-green-400 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap break-all">{`<script defer data-site="${trackingId}" data-endpoint="e" src="/stats/s.js"></script>`}</pre>
          <p>
            The proxy must pass the visitor&apos;s real IP (X-Real-IP) so unique-visitor counts and countries stay
            accurate. Optional script attributes: <code>data-behavior=&quot;off&quot;</code> (disable click/error signals),{' '}
            <code>data-spa=&quot;off&quot;</code>, <code>data-respect-dnt=&quot;true&quot;</code>,{' '}
            <code>data-aydex-ignore</code> on any element to exclude its clicks.
          </p>
        </div>
      </details>

      {storageMode !== 'memory' && key && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3 space-y-2">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
            🔑 Encryption key — save this now, we don&apos;t store it and can&apos;t show it again.
          </p>
          <div className="flex gap-2">
            <input readOnly value={key} className="input flex-1 font-mono text-xs bg-white dark:bg-zinc-900" />
            <button onClick={regenerateKey} className="btn-secondary text-xs shrink-0">Regenerate</button>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-500">
            This key is embedded in your page&apos;s own source (in the snippet above) so a visitor&apos;s browser
            can decrypt their own ID on their next visit. It protects the stored value from other scripts on your
            page reading it — it isn&apos;t a secret from your own site&apos;s visitors, who can view page source.
          </p>
        </div>
      )}
    </div>
  )
}
