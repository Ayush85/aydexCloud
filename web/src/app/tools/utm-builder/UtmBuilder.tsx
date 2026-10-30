'use client'

import { useState } from 'react'
import { buildUtmUrl } from '@/lib/utm'

const FIELDS: { k: 'url' | 'source' | 'medium' | 'campaign' | 'term' | 'content'; label: string; ph: string; req: boolean }[] = [
  { k: 'url', label: 'Page URL', ph: 'https://example.com/pricing', req: true },
  { k: 'source', label: 'Source', ph: 'newsletter', req: true },
  { k: 'medium', label: 'Medium', ph: 'email', req: true },
  { k: 'campaign', label: 'Campaign', ph: 'black_friday', req: true },
  { k: 'term', label: 'Term (optional)', ph: 'paid keyword', req: false },
  { k: 'content', label: 'Content (optional)', ph: 'header_button', req: false },
]

export function UtmBuilder() {
  const [v, setV] = useState({ url: '', source: '', medium: '', campaign: '', term: '', content: '' })
  const [copied, setCopied] = useState(false)
  const r = v.url || v.source || v.medium || v.campaign ? buildUtmUrl(v) : null

  async function copy(url: string) {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ }
  }

  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 space-y-4">
      {FIELDS.map((f) => (
        <label key={f.k} className="block">
          <span className="text-sm font-medium text-zinc-300">{f.label}{f.req && <span className="text-zinc-500"> *</span>}</span>
          <input value={v[f.k]} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} placeholder={f.ph} maxLength={500}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-brand-500 focus:outline-none" />
        </label>
      ))}
      <div aria-live="polite" className="pt-2">
        {r && !r.ok && <p className="text-sm text-amber-400">{r.error}</p>}
        {r?.ok && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">Your link</p>
            <code className="block break-all rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-xs text-green-400">{r.url}</code>
            <button onClick={() => copy(r.url)} className="btn-land-primary text-sm">{copied ? 'Copied' : 'Copy link'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
