'use client'

import type { Period } from './dashboardTypes'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
]

export function PeriodPicker({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex gap-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-1">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            period === p.key
              ? 'bg-brand-600 text-white'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
