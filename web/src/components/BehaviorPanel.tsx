import type { DashboardData } from './dashboardTypes'

function Table({ title, hint, head, rows, empty }: { title: string; hint: string; head: string[]; rows: (string | number)[][]; empty: string }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100">{title}</h3>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{hint}</p>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-slate-400 dark:text-zinc-500 text-sm">{empty}</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-500 dark:text-zinc-400 uppercase">
            <tr>
              {head.map((h, i) => (
                <th key={h} className={`px-4 py-2.5 font-medium ${i === head.length - 1 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className={`px-4 py-2.5 ${j === r.length - 1 ? 'text-right tabular-nums font-medium' : 'font-mono text-xs truncate max-w-[260px]'} text-slate-700 dark:text-zinc-300`} title={String(c)}>
                    {typeof c === 'number' ? c.toLocaleString() : c || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function BehaviorPanel({ b }: { b: DashboardData['behavior'] }) {
  return (
    <div className="space-y-6">
      <div className="card p-5 text-sm text-slate-600 dark:text-zinc-400">
        <p>
          <strong className="text-slate-900 dark:text-zinc-100">Frustration signals without recordings.</strong>{' '}
          aydex counts rage clicks, dead clicks and JavaScript errors in the visitor&apos;s browser and sends only the
          count and a CSS selector — never screenshots, text, keystrokes or session replays.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            ['Rage clicks', b.totals.rage],
            ['Dead clicks', b.totals.dead],
            ['JS errors', b.totals.errors],
          ].map(([l, v]) => (
            <div key={l as string}>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">{Number(v).toLocaleString()}</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Table title="Rage clicks" hint="3+ rapid clicks in the same spot" head={['Page', 'Element', 'Events']} rows={b.rage.map((r) => [r.page, r.target, Number(r.count)])} empty="No rage clicks — nice." />
        <Table title="Dead clicks" hint="Button-like elements that did nothing (heuristic)" head={['Page', 'Element', 'Events']} rows={b.dead.map((r) => [r.page, r.target, Number(r.count)])} empty="No dead clicks detected." />
      </div>
      <Table title="JavaScript errors" hint="Messages are scrubbed of emails, long numbers and query strings" head={['Message', 'File', 'Visitors', 'Events']} rows={b.errors.map((r) => [r.message, r.file, Number(r.visitors), Number(r.count)])} empty="No errors reported." />
      <div className="grid md:grid-cols-2 gap-6">
        <Table title="Outbound links" hint="Clicks to other sites (origin + path only)" head={['URL', 'Clicks']} rows={b.outbound.map((r) => [r.url, Number(r.count)])} empty="No outbound clicks yet." />
        <Table title="File downloads" hint="PDF, ZIP, DOCX and similar" head={['File', 'Downloads']} rows={b.downloads.map((r) => [r.file, Number(r.count)])} empty="No downloads yet." />
      </div>
    </div>
  )
}
