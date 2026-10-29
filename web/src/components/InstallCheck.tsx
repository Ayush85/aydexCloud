'use client'

import { useState } from 'react'

interface Result { installed: boolean | null; receivedData: boolean; message: string }

export function InstallCheck({ siteId, domain }: { siteId: string; domain: string }) {
  const [res, setRes] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function run() {
    setBusy(true); setErr(''); setRes(null)
    try {
      const r = await fetch(`/api/sites/${siteId}/verify`, { method: 'POST' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error ?? 'Check failed.')
      setRes(j)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Check failed.') } finally { setBusy(false) }
  }

  const tone = !res ? '' : res.installed && res.receivedData ? 'text-emerald-600 dark:text-emerald-400'
    : res.installed ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Verify installation</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Fetches https://{domain}/ and looks for your tracking script, then checks whether data arrived in the last 24 hours.
            Scripts added later by JavaScript or only on other pages will not be seen; the data check still works.
          </p>
        </div>
        <button onClick={run} disabled={busy} className="btn-primary text-sm shrink-0">{busy ? 'Checking…' : 'Check now'}</button>
      </div>
      {res && (
        <p className={`mt-3 text-sm ${tone}`} role="status">
          {res.message}{res.installed === null && res.receivedData ? ' Data was received in the last 24 hours, so tracking is working.' : ''}
        </p>
      )}
      {err && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{err}</p>}
    </div>
  )
}
