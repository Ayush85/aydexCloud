'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Period } from './dashboardTypes'

interface Step { type: 'page' | 'event'; value: string; visitors: number; conversionFromStart: number; conversionFromPrev: number }
interface Funnel { id: string; name: string; steps: Step[] }
interface Draft { type: 'page' | 'event'; value: string }

export function FunnelsPanel({ siteId, period }: { siteId: string; period: Period }) {
  const [funnels, setFunnels] = useState<Funnel[] | null>(null)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [steps, setSteps] = useState<Draft[]>([{ type: 'page', value: '/' }, { type: 'event', value: '' }])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/funnels/${siteId}?period=${period}`)
      if (!res.ok) throw new Error()
      setFunnels(await res.json())
    } catch {
      setError('Could not load funnels.')
    }
  }, [siteId, period])

  useEffect(() => { load() }, [load])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/funnels/${siteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, steps }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setName('')
      setSteps([{ type: 'page', value: '/' }, { type: 'event', value: '' }])
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create funnel.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await fetch(`/api/funnels/${siteId}/${id}`, { method: 'DELETE' })
    load()
  }

  const setStep = (i: number, patch: Partial<Draft>) => setSteps((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Funnels</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              Where visitors drop off between steps. Steps must happen in order within 24 hours.
            </p>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="btn-secondary text-sm">{showForm ? 'Cancel' : 'New funnel'}</button>
        </div>
        {showForm && (
          <form onSubmit={create} className="px-5 pb-5 space-y-3 border-t border-slate-100 dark:border-zinc-800 pt-4">
            <input className="input" placeholder="Funnel name (e.g. Signup)" value={name} onChange={(e) => setName(e.target.value)} required />
            {steps.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-xs text-slate-400 w-12">Step {i + 1}</span>
                <select className="input w-auto" value={s.type} onChange={(e) => setStep(i, { type: e.target.value as Draft['type'] })}>
                  <option value="page">Page visit</option>
                  <option value="event">Custom event</option>
                </select>
                <input className="input flex-1" placeholder={s.type === 'page' ? '/pricing' : 'signup'} value={s.value} onChange={(e) => setStep(i, { value: e.target.value })} required />
                {steps.length > 2 && (
                  <button type="button" onClick={() => setSteps((x) => x.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600 text-xs">Remove</button>
                )}
              </div>
            ))}
            <div className="flex gap-3">
              {steps.length < 8 && (
                <button type="button" onClick={() => setSteps((x) => [...x, { type: 'page', value: '' }])} className="btn-secondary text-sm">Add step</button>
              )}
              <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving…' : 'Create funnel'}</button>
            </div>
          </form>
        )}
        {error && <p className="px-5 pb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {funnels === null ? (
        <div className="card p-6 h-40 animate-pulse bg-slate-100 dark:bg-zinc-800" />
      ) : funnels.length === 0 ? (
        <div className="card px-5 py-10 text-center text-slate-400 dark:text-zinc-500 text-sm">No funnels yet. Create one to see where visitors drop off.</div>
      ) : (
        funnels.map((f) => (
          <div key={f.id} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-900 dark:text-zinc-100">{f.name}</h4>
              <button onClick={() => remove(f.id)} className="text-slate-400 hover:text-red-600 text-xs">Remove</button>
            </div>
            <ol className="space-y-3">
              {f.steps.map((s, i) => (
                <li key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 dark:text-zinc-300">
                      <span className="text-slate-400 mr-2">{i + 1}.</span>
                      <span className="font-mono text-xs">{s.type === 'page' ? s.value : `event: ${s.value}`}</span>
                    </span>
                    <span className="tabular-nums text-slate-600 dark:text-zinc-400">
                      {s.visitors.toLocaleString()}
                      {i > 0 && <span className="text-xs text-slate-400 ml-2">{Math.round(s.conversionFromPrev * 100)}% of previous</span>}
                    </span>
                  </div>
                  <div className="h-2.5 rounded bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-brand-600 rounded" style={{ width: `${Math.max(2, Math.round(s.conversionFromStart * 100))}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))
      )}
    </div>
  )
}
