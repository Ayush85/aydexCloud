import { fmtDuration, type DashboardData } from './dashboardTypes'

function Card({ label, value, hint, delta }: { label: string; value: string; hint?: string; delta?: { text: string; good: boolean } | null }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-slate-500 dark:text-zinc-400 mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">{value}</div>
        {delta && (
          <div className={`mb-0.5 text-xs font-semibold ${delta.good ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {delta.text}
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{hint}</p>}
    </div>
  )
}

export function EngagementCards({ cur, prev }: { cur: DashboardData['engagement']; prev: DashboardData['prevEngagement'] }) {
  const havePrev = prev.sessions > 0 && cur.sessions > 0
  const bounceDelta = havePrev ? (cur.bounce_rate - prev.bounce_rate) * 100 : null
  const timeDelta = havePrev && prev.avg_time_s > 0 && cur.avg_time_s > 0 ? cur.avg_time_s - prev.avg_time_s : null
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card label="Sessions" value={cur.sessions.toLocaleString()} hint="Visitor × day" />
      <Card
        label="Bounce rate"
        value={cur.sessions ? `${Math.round(cur.bounce_rate * 100)}%` : '—'}
        hint="Single-page sessions"
        delta={bounceDelta === null || Math.abs(bounceDelta) < 0.5 ? null : { text: `${bounceDelta > 0 ? '+' : '−'}${Math.abs(bounceDelta).toFixed(1)} pts`, good: bounceDelta < 0 }}
      />
      <Card
        label="Avg. time on page"
        value={fmtDuration(cur.avg_time_s)}
        hint={cur.avg_time_s ? 'Visible-tab time only' : 'Collecting — needs tracker v2'}
        delta={timeDelta === null || Math.abs(timeDelta) < 2 ? null : { text: `${timeDelta > 0 ? '+' : '−'}${fmtDuration(Math.abs(timeDelta))}`, good: timeDelta > 0 }}
      />
      <Card label="Avg. scroll depth" value={cur.avg_scroll ? `${cur.avg_scroll}%` : '—'} hint="Deepest point reached" />
    </div>
  )
}
