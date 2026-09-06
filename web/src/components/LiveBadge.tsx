'use client'

import { useState, useEffect } from 'react'

export function LiveBadge({ siteId }: { siteId: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchCount() {
      try {
        const res = await fetch(`/api/analytics/${siteId}/live`)
        if (res.ok && mounted) {
          const data = await res.json()
          setCount(data.count)
        }
      } catch {
        // silently ignore
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30_000)
    return () => { mounted = false; clearInterval(interval) }
  }, [siteId])

  if (count === null) return null

  return (
    <div className="flex items-center gap-2 rounded-full border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 px-3 py-1 text-sm text-green-700 dark:text-green-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <span className="font-semibold">{count}</span>
      <span className="text-green-600 dark:text-green-500">visitor{count !== 1 ? 's' : ''} right now</span>
    </div>
  )
}
