import { Sparkline } from './Sparkline'

interface Totals {
  total_views: number
  unique_visitors: number
}

interface Props {
  totals: Totals
  prevTotals?: Totals
  chart?: Array<{ views: number; visitors: number }>
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function delta(current: number, prev: number): { pct: string; up: boolean } | null {
  if (!prev) return null
  const pct = ((current - prev) / prev) * 100
  return { pct: Math.abs(pct).toFixed(1), up: pct >= 0 }
}

function StatCard({ label, value, prev, spark, color }: { label: string; value: number; prev?: number; spark?: number[]; color: string }) {
  const d = prev !== undefined ? delta(value, prev) : null
  return (
    <div className="card p-5">
      <div className="text-sm text-slate-500 dark:text-zinc-400 mb-1">{label}</div>
      <div className="flex items-end gap-3">
        <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100">{fmt(value)}</div>
        {d && (
          <div className={`mb-1 flex items-center gap-0.5 text-sm font-semibold ${
            d.up ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
          }`}>
            {d.up ? '↑' : '↓'} {d.pct}%
          </div>
        )}
      </div>
      {d && (
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">vs previous period</p>
      )}
      {spark && spark.length > 1 && <div className="mt-3 -mx-1"><Sparkline data={spark} color={color} height={44} /></div>}
    </div>
  )
}

export function StatsCards({ totals, prevTotals, chart }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        label="Total pageviews"
        value={totals.total_views}
        prev={prevTotals?.total_views}
        spark={chart?.map((c) => Number(c.views))}
        color="#6366f1"
      />
      <StatCard
        label="Unique visitors"
        value={totals.unique_visitors}
        prev={prevTotals?.unique_visitors}
        spark={chart?.map((c) => Number(c.visitors))}
        color="#22c55e"
      />
    </div>
  )
}
