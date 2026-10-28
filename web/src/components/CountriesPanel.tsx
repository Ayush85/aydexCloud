import type { DashboardData } from './dashboardTypes'

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

export function CountriesPanel({ rows }: { rows: DashboardData['countries'] }) {
  const total = rows.reduce((a, r) => a + Number(r.views), 0)
  const max = Math.max(1, ...rows.map((r) => Number(r.views)))
  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-3">Countries</h3>
      {rows.length === 0 ? (
        <p className="text-slate-400 dark:text-zinc-500 text-sm py-4 text-center">No country data yet — configure a GeoIP database on the tracker</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => {
            const v = Number(r.views)
            return (
              <li key={r.country}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 dark:text-zinc-300">{countryName(r.country)} <span className="text-xs text-slate-400">{r.country}</span></span>
                  <span className="tabular-nums text-slate-500 dark:text-zinc-400">{v.toLocaleString()} · {Math.round((v / total) * 100)}%</span>
                </div>
                <div className="h-2 rounded bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded bg-indigo-500" style={{ width: `${(v / max) * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
