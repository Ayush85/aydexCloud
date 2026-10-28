'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props { siteId: string; initialEnabled: boolean; allowed: boolean; initialWebhook: string | null }

async function patch(siteId: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/sites/${siteId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? 'Could not save.')
  return json
}

export function AlertsPanel({ siteId, initialEnabled, allowed, initialWebhook }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [webhook, setWebhook] = useState<string | null>(initialWebhook)
  const [url, setUrl] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(fn: () => Promise<void>) {
    setBusy(true); setMsg(null)
    try { await fn() } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong.' }) } finally { setBusy(false) }
  }

  const toggle = () => run(async () => {
    await patch(siteId, { alertsEnabled: !enabled })
    setEnabled(!enabled)
  })
  const saveWebhook = () => run(async () => {
    const j = await patch(siteId, { webhookUrl: url })
    setWebhook(j.webhook); setUrl(''); setMsg({ ok: true, text: j.webhook ? 'Webhook saved.' : 'Webhook removed.' })
  })
  const removeWebhook = () => run(async () => {
    await patch(siteId, { webhookUrl: '' })
    setWebhook(null); setMsg({ ok: true, text: 'Webhook removed.' })
  })
  const test = () => run(async () => {
    const res = await fetch(`/api/sites/${siteId}/webhook-test`, { method: 'POST' })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(j.error ?? 'Test failed.')
    setMsg({ ok: true, text: 'Test message sent.' })
  })

  return (
    <div className="space-y-6 mt-4">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Traffic alerts</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Each morning (UTC) aydex compares yesterday with the previous 14 days and emails you if traffic dropped
              sharply, spiked, or stopped entirely (a sign the tracking script may be broken). Sites under about 20
              pageviews a day are skipped because there is too little signal.
            </p>
          </div>
          <button onClick={toggle} disabled={busy || !allowed} role="switch" aria-checked={enabled} aria-label="Traffic alerts"
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${enabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-zinc-700'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        {!allowed && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
            Traffic alerts are included on the Pro and Agency plans. <Link href="/dashboard/billing" className="underline">Upgrade</Link>
          </p>
        )}
      </div>

      <div className="card p-5 space-y-3">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Slack or Discord</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Send alerts and the weekly summary to a channel. Create an incoming webhook in Slack (Apps, Incoming Webhooks)
            or Discord (Channel settings, Integrations, Webhooks) and paste its URL. Available on every plan; alerts need Pro.
          </p>
        </div>
        {webhook ? (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm">
            <span className="text-slate-700 dark:text-zinc-300">{webhook}</span>
            <span className="flex gap-3">
              <button onClick={test} disabled={busy} className="text-brand-600 hover:underline text-xs">Send test</button>
              <button onClick={removeWebhook} disabled={busy} className="text-slate-400 hover:text-red-600 text-xs">Remove</button>
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <input className="input flex-1" placeholder="https://hooks.slack.com/services/… or https://discord.com/api/webhooks/…" value={url} onChange={(e) => setUrl(e.target.value)} />
            <button onClick={saveWebhook} disabled={busy || !url.trim()} className="btn-primary text-sm">Save</button>
          </div>
        )}
        {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{msg.text}</p>}
      </div>
    </div>
  )
}
