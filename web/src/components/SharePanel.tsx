'use client'

import { useState } from 'react'

interface Props {
  siteId: string
  initialIsPublic: boolean
  initialPublicToken: string | null
}

export function SharePanel({ siteId, initialIsPublic, initialPublicToken }: Props) {
  const [isPublic, setIsPublic]   = useState(initialIsPublic)
  const [token, setToken]         = useState(initialPublicToken)
  const [loading, setLoading]     = useState(false)
  const [copied, setCopied]       = useState(false)

  const publicUrl = token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${token}`
    : null

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic }),
      })
      const data = await res.json()
      setIsPublic(data.isPublic)
      setToken(data.publicToken)
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="card p-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900 dark:text-zinc-100">Public dashboard</p>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Share a read-only view of your analytics with anyone — no login required.
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
            isPublic ? 'bg-brand-600' : 'bg-slate-200 dark:bg-zinc-700'
          }`}
          aria-pressed={isPublic}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
              isPublic ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Link */}
      {isPublic && publicUrl && (
        <div className="card p-5 space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Public link</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={publicUrl}
              className="input flex-1 font-mono text-xs"
            />
            <button onClick={copy} className="btn-primary shrink-0">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
          >
            Open in new tab
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      )}

      {/* Embed snippet */}
      {isPublic && (
        <div className="card p-5 space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Embed on your site</p>
          <div className="rounded-lg bg-slate-900 p-3 overflow-x-auto">
            <code className="text-green-400 text-xs font-mono whitespace-nowrap">
              {`<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`}
            </code>
          </div>
        </div>
      )}

      {/* Custom events guide */}
      <div className="card p-5 space-y-3">
        <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Track custom events</p>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Once the tracking snippet is installed, call <code className="bg-slate-100 dark:bg-zinc-800 px-1 rounded">aydex.track()</code> anywhere in your JS:
        </p>
        <div className="rounded-lg bg-slate-900 p-3 overflow-x-auto space-y-1">
          {[
            `// Track a conversion`,
            `aydex.track('signup')`,
            ``,
            `// Track with properties`,
            `aydex.track('purchase', { plan: 'pro' })`,
          ].map((line, i) => (
            <div key={i} className="font-mono text-xs">
              {line.startsWith('//') ? (
                <span className="text-zinc-500">{line}</span>
              ) : line === '' ? (
                <span>&nbsp;</span>
              ) : (
                <span className="text-green-400">{line}</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-zinc-500">
          Events appear in the <strong>Campaigns & Events</strong> tab under &ldquo;Custom Events&rdquo;.
        </p>
      </div>
    </div>
  )
}
