'use client'

import { useCallback, useEffect, useState } from 'react'
import { parseGa4Csv, type ImportRow } from '@/lib/csvImport'

interface Status { days: number; first: string | null; last: string | null }

export function ImportPanel({ siteId }: { siteId: string }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/import/${siteId}`)
      if (res.ok) setStatus(await res.json())
    } catch { /* status is cosmetic */ }
  }, [siteId])
  useEffect(() => { load() }, [load])

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(''); setDone(''); setRows([]); setWarnings([])
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5_000_000) { setError('File is larger than 5 MB.'); return }
    const r = parseGa4Csv(await f.text())
    if (r.error) { setError(r.error); return }
    setRows(r.rows); setWarnings(r.warnings)
  }

  async function confirm() {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/import/${siteId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) })
      if (!res.ok) throw new Error((await res.json()).error)
      const j = await res.json()
      setDone(`Imported ${j.imported} days (${j.first} → ${j.last}). They appear in charts for dates before your first aydex pageview.`)
      setRows([]); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    } finally { setBusy(false) }
  }

  async function removeAll() {
    if (!window.confirm('Remove all imported history for this site?')) return
    await fetch(`/api/import/${siteId}`, { method: 'DELETE' })
    setDone('Imported history removed.'); load()
  }

  const total = rows.reduce((a, r) => a + r.pageviews, 0)
  return (
    <div className="card p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Import Google Analytics history</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Keep your trend lines when you switch. In GA4 open Reports, choose a report with a Date or Day dimension, then
          Share → Download file → CSV. The file is read in your browser; only daily totals are uploaded.
        </p>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
          Imported days only fill dates before your first aydex pageview, so nothing is double counted. Visitor totals are
          the sum of daily users.
        </p>
      </div>
      {status && status.days > 0 && (
        <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-zinc-800/50 rounded-lg px-4 py-2.5">
          <span className="text-slate-700 dark:text-zinc-300">{status.days} imported days ({status.first} → {status.last})</span>
          <button onClick={removeAll} className="text-xs text-slate-400 hover:text-red-600">Remove</button>
        </div>
      )}
      <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {done && <p className="text-sm text-emerald-600 dark:text-emerald-400">{done}</p>}
      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-700 dark:text-zinc-300">
            Ready: <strong>{rows.length}</strong> days, {total.toLocaleString()} pageviews ({rows[0].date} → {rows[rows.length - 1].date})
          </p>
          {warnings.map((w) => <p key={w} className="text-xs text-amber-600 dark:text-amber-400">{w}</p>)}
          <button onClick={confirm} disabled={busy} className="btn-primary text-sm">{busy ? 'Importing…' : 'Import these days'}</button>
        </div>
      )}
    </div>
  )
}
