'use client'

import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { useId } from 'react'

export function Sparkline({ data, color = '#6366f1', height = 40 }: { data: number[]; color?: string; height?: number }) {
  const id = useId().replace(/:/g, '')
  const points = data.map((value, i) => ({ i, value }))
  const flat = data.every((v) => v === data[0])

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${id})`}
          isAnimationActive={false}
          {...(flat ? { strokeOpacity: 0.4 } : {})}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
