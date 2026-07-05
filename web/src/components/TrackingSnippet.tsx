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

export function TrackingSnippet({ siteId, trackingId, trackerUrl, initialStorageMode }: Props) {
  const [storageMode, setStorageMode] = useState(initialStorageMode)
  const [key, setKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

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
        <p className="text-sm font-medium text-slate-700 mb-1">📋 Tracking snippet — paste before &lt;/head&gt;</p>
        <div className="mt-1 bg-slate-900 rounded-lg p-3 overflow-x-auto flex items-start justify-between gap-3">
          <code className="text-green-400 text-xs font-mono whitespace-pre-wrap break-all">{snippet}</code>
          <button onClick={copySnippet} className="shrink-0 text-xs text-slate-300 hover:text-white">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">
          Persistent visitor ID storage {saving && <span className="text-xs text-slate-400">(saving…)</span>}
        </label>
        <select
          className="input"
          value={storageMode}
          onChange={(e) => handleModeChange(e.target.value)}
        >
          {STORAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <p className="text-xs text-slate-400 mt-1">
          Memory only means every visit looks like a new visitor (today&apos;s default). Choosing a persistent
          option recognizes repeat visitors across sessions, encrypted with the key below.
        </p>
      </div>

      {storageMode !== 'memory' && key && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-xs font-medium text-amber-800">
            🔑 Encryption key — save this now, we don&apos;t store it and can&apos;t show it again.
          </p>
          <div className="flex gap-2">
            <input readOnly value={key} className="input flex-1 font-mono text-xs bg-white" />
            <button onClick={regenerateKey} className="btn-secondary text-xs shrink-0">Regenerate</button>
          </div>
          <p className="text-xs text-amber-700">
            This key is embedded in your page&apos;s own source (in the snippet above) so a visitor&apos;s browser
            can decrypt their own ID on their next visit. It protects the stored value from other scripts on your
            page reading it — it isn&apos;t a secret from your own site&apos;s visitors, who can view page source.
          </p>
        </div>
      )}
    </div>
  )
}
