interface Row {
  label: string
  value: number
}

interface Props {
  title: string
  rows: Row[]
  total: number
  emptyMsg?: string
}

export function TopList({ title, rows, total, emptyMsg = 'No data yet' }: Props) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-slate-400 dark:text-zinc-500 text-sm py-4 text-center">{emptyMsg}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, i) => {
            const pct = total > 0 ? Math.round((row.value / total) * 100) : 0
            return (
              <li key={i} className="relative">
                <div
                  className="absolute inset-y-0 left-0 bg-brand-50 dark:bg-brand-500/10 rounded"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between px-2 py-1 text-sm">
                  <span
                    className="text-slate-700 dark:text-zinc-300 truncate max-w-[200px]"
                    title={row.label}
                  >
                    {row.label || '(direct)'}
                  </span>
                  <span className="text-slate-500 dark:text-zinc-400 font-medium tabular-nums ml-4">
                    {row.value.toLocaleString()}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
