'use client'

import { useState } from 'react'

interface Note { id: string; date: string; text: string }

export function AnnotationsPanel({ siteId, notes, onChange }: { siteId: string; notes: Note[]; onChange: () => void }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/annotations/${siteId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, text }) })
      if (!res.ok) throw new Error((await res.json()).error)
      setText(''); setOpen(false); onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the note.')
    } finally { setBusy(false) }
  }

  async function remove(id: string) {
    await fetch(`/api/annotations/${siteId}/${id}`, { method: 'DELETE' })
    onChange()
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300">Notes on the chart</h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Mark launches, campaigns and releases so you remember why traffic moved.</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="btn-secondary text-sm">{open ? 'Cancel' : 'Add note'}</button>
      </div>
      {open && (
        <form onSubmit={add} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input type="date" className="input sm:w-44" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} required />
          <input className="input flex-1" placeholder="e.g. Launched on Product Hunt" maxLength={140} value={text} onChange={(e) => setText(e.target.value)} required />
          <button type="submit" disabled={busy} className="btn-primary text-sm">{busy ? 'Saving…' : 'Save'}</button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {notes.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
          {notes.map((n) => (
            <li key={n.id} className="flex items-center justify-between py-2 gap-3">
              <span><span className="font-mono text-xs text-amber-600 dark:text-amber-400 mr-2">{n.date}</span><span className="text-slate-700 dark:text-zinc-300">{n.text}</span></span>
              <button onClick={() => remove(n.id)} className="text-xs text-slate-400 hover:text-red-600">Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
