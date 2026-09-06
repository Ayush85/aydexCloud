'use client'

import { AreaChart, Area, ResponsiveContainer } from 'recharts'

export function Sparkline({ data }: { data: number[] }) {
  const points = data.map((value, i) => ({ i, value }))
  const flat = data.every((v) => v === data[0])

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="#6366f1"
          strokeWidth={1.5}
          fill="url(#sparkGrad)"
          isAnimationActive={false}
          {...(flat ? { strokeOpacity: 0.4 } : {})}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
