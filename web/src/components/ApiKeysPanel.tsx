'use client'

import { useState } from 'react'

interface ApiKeyRow {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  createdAt: string
}

interface Props {
  initialKeys: ApiKeyRow[]
  apiAccess: boolean
}

export function ApiKeysPanel({ initialKeys, apiAccess }: Props) {
  const [keys, setKeys] = useState(initialKeys)
  const [name, setName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNewKey(data.key)
      setKeys((prev) => [{ id: data.id, name: data.name, keyPrefix: data.key.slice(0, 16), lastUsedAt: null, createdAt: new Date().toISOString() }, ...prev])
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create key.')
    }
  }

  async function revoke(id: string) {
    await fetch(`/api/keys/${id}`, { method: 'DELETE' })
    setKeys((prev) => prev.filter((k) => k.id !== id))
  }

  if (!apiAccess) {
    return (
      <div className="card p-8 text-center">
        <p className="text-2xl mb-2">🔑</p>
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 mb-1">API access is a Pro+ feature</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">Upgrade your plan to generate API keys and use the public REST API.</p>
        <a href="/dashboard/billing" className="btn-primary text-sm">View plans</a>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <form onSubmit={create} className="card p-5 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">New key name</label>
          <input
            className="input"
            placeholder="e.g. CI pipeline"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary text-sm shrink-0">Generate</button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {newKey && (
        <div className="card p-5 border-brand-200 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-500/10">
          <p className="text-sm font-medium text-slate-800 dark:text-zinc-200 mb-2">Copy your key now — it won&apos;t be shown again.</p>
          <code className="block bg-slate-900 dark:bg-black text-green-400 text-xs font-mono p-3 rounded-lg break-all">{newKey}</code>
        </div>
      )}

      <div className="card overflow-hidden">
        {keys.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-400 dark:text-zinc-500 text-sm">No API keys yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-500 dark:text-zinc-400 uppercase">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Name</th>
                <th className="px-4 py-2.5 text-left font-medium">Key</th>
                <th className="px-4 py-2.5 text-left font-medium">Last used</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-zinc-200">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-zinc-400">{k.keyPrefix}…</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-zinc-400">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => revoke(k.id)} className="text-slate-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 text-xs">Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-5 space-y-3">
        <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Calling the API</p>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Pass your key as a bearer token to fetch a site&apos;s totals, daily timeseries, and top pages:
        </p>
        <div className="rounded-lg bg-slate-900 dark:bg-black p-3 overflow-x-auto">
          <code className="text-green-400 text-xs font-mono whitespace-pre">
{`curl -H "Authorization: Bearer ax_live_..." \\
  "https://your-domain.com/api/v1/stats/<siteId>?period=7d"`}
          </code>
        </div>
      </div>
    </div>
  )
}
