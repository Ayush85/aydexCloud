'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

interface Props {
  title: string
  data: Array<{ name: string; value: number }>
}

export function DeviceBreakdown({ title, data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-slate-700 mb-3">{title}</h3>
      {data.length === 0 ? (
        <p className="text-slate-400 text-sm py-4 text-center">No data yet</p>
      ) : (
        <div className="flex gap-4 items-center">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} (${Math.round((v / total) * 100)}%)`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex-1 space-y-1">
            {data.map((d, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="capitalize">{d.name || 'Unknown'}</span>
                </span>
                <span className="text-slate-500 tabular-nums">
                  {Math.round((d.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
