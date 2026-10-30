'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface DataPoint {
  date: string
  views: number
  visitors: number
}

interface Props {
  data: DataPoint[]
  period: string
  annotations?: { id: string; date: string; text: string }[]
}

function formatDate(iso: string, period: string) {
  const d = new Date(iso)
  if (period === 'today') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function PageviewsChart({ data, period, annotations = [] }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDate(d.date, period),
  }))
  // Markers sit on the day's x position. The hourly "today" view has no day axis, so none are drawn.
  const markers = period === 'today' ? [] : annotations.flatMap((a) => {
    const point = data.find((d) => d.date.slice(0, 10) === a.date)
    return point ? [{ id: a.id, x: formatDate(point.date, period), text: a.text }] : []
  })

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-4">Pageviews over time</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 dark:text-zinc-500 text-sm">
          No data yet — install the tracking snippet to start collecting visits.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formatted} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12, color: 'inherit' }}
              labelStyle={{ fontWeight: 600 }}
            />
            {markers.map((m) => (
              <ReferenceLine
                key={m.id}
                x={m.x}
                stroke="#f59e0b"
                strokeDasharray="4 3"
                label={{ value: m.text.length > 18 ? `${m.text.slice(0, 17)}…` : m.text, position: 'insideTopLeft', fontSize: 10, fill: '#f59e0b' }}
              />
            ))}
            <Area
              type="monotone"
              dataKey="views"
              name="Pageviews"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#gradViews)"
            />
            <Area
              type="monotone"
              dataKey="visitors"
              name="Visitors"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#gradVisitors)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
