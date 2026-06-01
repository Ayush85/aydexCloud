'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface DataPoint {
  date: string
  views: number
  visitors: number
}

interface Props {
  data: DataPoint[]
  period: string
}

function formatDate(iso: string, period: string) {
  const d = new Date(iso)
  if (period === 'today') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function PageviewsChart({ data, period }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDate(d.date, period),
  }))

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-slate-700 mb-4">Pageviews over time</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ fontWeight: 600 }}
            />
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
