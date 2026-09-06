'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteSiteButton({ siteId, siteName }: { siteId: string; siteName: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/sites/${siteId}`, { method: 'DELETE' })
    router.refresh()
  }

  // Sits inside a <Link> card on the dashboard grid — stop the click from
  // bubbling up into the card's own navigation. Handled here (not by the
  // server-component page that renders this) since only a Client Component
  // can attach event handlers.
  function stop(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  if (confirming) {
    return (
      <div className="flex gap-1" onClick={stop}>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => { stop(e); setConfirming(true) }}
      title={`Delete ${siteName}`}
      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </button>
  )
}
