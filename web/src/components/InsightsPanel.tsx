import type { DashboardData } from './dashboardTypes'

const TONE: Record<string, { dot: string; icon: string }> = {
  good: { dot: 'bg-emerald-500', icon: '↗' },
  bad: { dot: 'bg-red-500', icon: '↘' },
  neutral: { dot: 'bg-slate-400 dark:bg-zinc-500', icon: '•' },
}

export function InsightsPanel({ insights }: { insights: DashboardData['insights'] }) {
  if (insights.length === 0) return null
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300">Why your traffic changed</h3>
        <span className="text-xs text-slate-400 dark:text-zinc-500">Computed from your own numbers — no guesses</span>
      </div>
      <ul className="space-y-2.5">
        {insights.map((i, idx) => {
          const t = TONE[i.tone] ?? TONE.neutral
          return (
            <li key={idx} className="flex gap-3 text-sm text-slate-700 dark:text-zinc-300">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${t.dot}`} aria-hidden />
              <span>{i.text}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
