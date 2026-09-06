interface Campaign {
  source: string
  medium: string
  campaign: string
  visits: number
  visitors: number
}

interface CustomEvent {
  event_name: string
  count: number
  unique_visitors: number
}

interface Props {
  campaigns: Campaign[]
  events: CustomEvent[]
}

export function CampaignsTable({ campaigns, events }: Props) {
  return (
    <div className="space-y-6">
      {/* UTM Campaigns */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="font-semibold text-slate-900 dark:text-zinc-100">UTM Campaigns</h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
            Traffic tagged with <code className="bg-slate-100 dark:bg-zinc-800 px-1 rounded">utm_</code> parameters
          </p>
        </div>
        {campaigns.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-400 dark:text-zinc-500 text-sm">
            <p className="mb-2 text-2xl">📣</p>
            No UTM-tagged traffic yet.
            <br />
            Add <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1 rounded">?utm_source=twitter&utm_campaign=launch</code> to your links.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-500 dark:text-zinc-400 uppercase">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Source</th>
                <th className="px-4 py-2.5 text-left font-medium">Medium</th>
                <th className="px-4 py-2.5 text-left font-medium">Campaign</th>
                <th className="px-4 py-2.5 text-right font-medium">Visits</th>
                <th className="px-5 py-2.5 text-right font-medium">Visitors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {campaigns.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-zinc-200">{c.source || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{c.medium || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 truncate max-w-[160px]">{c.campaign || '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-800 dark:text-zinc-200 font-medium">
                    {c.visits.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-500 dark:text-zinc-400">
                    {c.visitors.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Custom Events */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Custom Events</h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
            Fired via <code className="bg-slate-100 dark:bg-zinc-800 px-1 rounded">aydex.track(&apos;event-name&apos;)</code>
          </p>
        </div>
        {events.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-400 dark:text-zinc-500 text-sm">
            <p className="mb-2 text-2xl">⚡</p>
            No custom events yet.
            <br />
            Call <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1 rounded">aydex.track(&apos;signup&apos;)</code> in your JS to track conversions.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-500 dark:text-zinc-400 uppercase">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Event</th>
                <th className="px-4 py-2.5 text-right font-medium">Count</th>
                <th className="px-5 py-2.5 text-right font-medium">Unique visitors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {events.map((e, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      <span className="font-mono text-slate-800 dark:text-zinc-200 font-medium">{e.event_name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-800 dark:text-zinc-200">
                    {e.count.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-500 dark:text-zinc-400">
                    {e.unique_visitors.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
