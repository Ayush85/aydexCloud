'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddSiteButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, domain }),
    })

    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Failed to add site.')
      return
    }

    setOpen(false)
    setName('')
    setDomain('')
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Add website
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add a new website</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Website name
                </label>
                <input
                  className="input"
                  placeholder="My Blog"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Domain
                </label>
                <input
                  className="input"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">Without https:// or trailing slash</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Adding…' : 'Add website'}
                </button>
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
