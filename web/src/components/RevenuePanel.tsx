import type { DashboardData } from './dashboardTypes'

function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(n)
  } catch {
    return `${n.toLocaleString()} ${currency}`
  }
}

export function RevenuePanel({ rows }: { rows: DashboardData['revenue'] }) {
  if (rows.length === 0) {
    return (
      <div className="card p-8 text-sm text-slate-600 dark:text-zinc-400">
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 mb-2">Revenue by source</h3>
        <p className="mb-3">See which channels actually make money, not just which send traffic. Track a purchase with one line:</p>
        <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto">{`aydex.track('purchase', { revenue: 49, currency: 'USD' })`}</pre>
        <p className="mt-3 text-xs text-slate-400 dark:text-zinc-500">
          Any custom event with a numeric <code>revenue</code> property counts. A purchase is attributed to the source of that
          visitor&apos;s first pageview the same day.
        </p>
      </div>
    )
  }
  const totals = new Map<string, number>()
  rows.forEach((r) => totals.set(r.currency, (totals.get(r.currency) ?? 0) + Number(r.revenue)))
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from(totals.entries()).map(([cur, v]) => (
          <div key={cur} className="card p-5">
            <div className="text-sm text-slate-500 dark:text-zinc-400 mb-1">Revenue {cur && `(${cur})`}</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">{money(v, cur)}</div>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Revenue by source</h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Attributed to the visitor&apos;s first pageview source that day</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-500 dark:text-zinc-400 uppercase">
            <tr>
              <th className="px-5 py-2.5 text-left font-medium">Source</th>
              <th className="px-4 py-2.5 text-right font-medium">Orders</th>
              <th className="px-4 py-2.5 text-right font-medium">Buyers</th>
              <th className="px-5 py-2.5 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-5 py-3 text-slate-800 dark:text-zinc-200">{r.source}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-zinc-400">{Number(r.orders).toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-zinc-400">{Number(r.buyers).toLocaleString()}</td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-zinc-100">{money(Number(r.revenue), r.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
