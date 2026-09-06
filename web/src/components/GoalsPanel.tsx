'use client'

import { useState } from 'react'

interface Goal {
  id: string
  name: string
  type: string
  matchValue: string
  completions: number
  conversionRate: number
}

interface Props {
  siteId: string
  goals: Goal[]
  onChange: () => void
}

export function GoalsPanel({ siteId, goals, onChange }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'pageview' | 'event'>('pageview')
  const [matchValue, setMatchValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/goals/${siteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, matchValue }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setName('')
      setMatchValue('')
      setShowForm(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create goal.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(goalId: string) {
    await fetch(`/api/goals/${siteId}/${goalId}`, { method: 'DELETE' })
    onChange()
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Goals</h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
            Track a page visit or custom event as a conversion.
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-secondary text-sm">
          {showForm ? 'Cancel' : 'New goal'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 space-y-3">
          <input
            className="input"
            placeholder="Goal name (e.g. Signup)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="flex gap-3">
            <select
              className="input w-auto"
              value={type}
              onChange={(e) => setType(e.target.value as 'pageview' | 'event')}
            >
              <option value="pageview">Page visit</option>
              <option value="event">Custom event</option>
            </select>
            <input
              className="input flex-1"
              placeholder={type === 'pageview' ? '/thank-you' : 'signup'}
              value={matchValue}
              onChange={(e) => setMatchValue(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Create goal'}
          </button>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="px-5 py-10 text-center text-slate-400 dark:text-zinc-500 text-sm">
          <p className="mb-2 text-2xl">🎯</p>
          No goals yet. Add one to start tracking conversions.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-500 dark:text-zinc-400 uppercase">
            <tr>
              <th className="px-5 py-2.5 text-left font-medium">Goal</th>
              <th className="px-4 py-2.5 text-left font-medium">Matches</th>
              <th className="px-4 py-2.5 text-right font-medium">Completions</th>
              <th className="px-4 py-2.5 text-right font-medium">Conv. rate</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {goals.map((g) => (
              <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-800 dark:text-zinc-200">{g.name}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-zinc-400 font-mono text-xs">
                  {g.type}: {g.matchValue}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-800 dark:text-zinc-200">
                  {g.completions.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-zinc-400">
                  {(g.conversionRate * 100).toFixed(1)}%
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-slate-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 text-xs"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
