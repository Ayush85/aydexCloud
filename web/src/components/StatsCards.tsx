interface Props {
  totals: { total_views: number; unique_visitors: number }
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

export function StatsCards({ totals }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card p-5">
        <div className="text-sm text-slate-500 mb-1">Total pageviews</div>
        <div className="text-3xl font-extrabold text-slate-900">{fmt(totals.total_views)}</div>
      </div>
      <div className="card p-5">
        <div className="text-sm text-slate-500 mb-1">Unique visitors</div>
        <div className="text-3xl font-extrabold text-slate-900">{fmt(totals.unique_visitors)}</div>
      </div>
    </div>
  )
}
