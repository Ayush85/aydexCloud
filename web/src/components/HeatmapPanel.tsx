'use client'

import { useMemo } from 'react'
import type { DashboardData } from './dashboardTypes'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Weekday × hour grid in the viewer's local time. Darker = more pageviews. */
export function HeatmapPanel({ rows }: { rows: DashboardData['heatmap'] }) {
  const { grid, max, tz } = useMemo(() => {
    // The server buckets in UTC. Shift by the viewer's offset, rounded to whole hours.
    const shift = -Math.round(new Date().getTimezoneOffset() / 60)
    const g: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    for (const r of rows) {
      const abs = (Number(r.dow) - 1) * 24 + Number(r.hour) + shift
      const wrapped = ((abs % 168) + 168) % 168
      g[Math.floor(wrapped / 24)][wrapped % 24] += Number(r.views)
    }
    return { grid: g, max: Math.max(1, ...g.flat()), tz: `UTC${shift >= 0 ? '+' : '−'}${Math.abs(shift)}` }
  }, [rows])

  if (rows.length === 0) return null
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300">When visitors come</h3>
        <span className="text-xs text-slate-400 dark:text-zinc-500">Pageviews by weekday and hour · your local time ({tz})</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {grid.map((hours, d) => (
            <div key={d} className="flex items-center gap-1 mb-1">
              <span className="w-8 text-xs text-slate-400 dark:text-zinc-500">{DAYS[d]}</span>
              <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                {hours.map((v, h) => (
                  <div
                    key={h}
                    title={`${DAYS[d]} ${String(h).padStart(2, '0')}:00 — ${v.toLocaleString()} views`}
                    className="aspect-square rounded-[3px] bg-indigo-500"
                    style={{ opacity: v === 0 ? 0.06 : 0.18 + 0.82 * (v / max) }}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <span className="w-8" />
            <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
              {Array.from({ length: 24 }, (_, h) => (
                <span key={h} className="text-[10px] text-center text-slate-400 dark:text-zinc-500">{h % 3 === 0 ? h : ''}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
