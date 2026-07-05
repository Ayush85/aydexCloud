'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export interface ChartConfig {
  id: string
  name: string
  metric: string
  dimension: string
  chartType: string
  filterField: string | null
  filterValue: string | null
}

interface Props {
  chart: ChartConfig
  siteId: string
  period: string
  onDelete: (id: string) => void
}

type Row = { label?: string; value: number }

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

export function ChartCard({ chart, siteId, period, onDelete }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/charts/${siteId}/${chart.id}/data?period=${period}`)
      const json = await res.json()
      setRows(json.rows ?? [])
    } finally {
      setLoading(false)
    }
  }, [siteId, chart.id, period])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete() {
    await fetch(`/api/charts/${siteId}/${chart.id}`, { method: 'DELETE' })
    onDelete(chart.id)
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-700">{chart.name}</h3>
        {confirming ? (
          <div className="flex gap-1">
            <button onClick={handleDelete} className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">
              Delete
            </button>
            <button onClick={() => setConfirming(false)} className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            title="Delete chart"
            className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse bg-slate-100 rounded-lg" />
      ) : rows.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
      ) : chart.chartType === 'number' ? (
        <div className="text-4xl font-extrabold text-slate-900 py-4">{fmt(rows[0]?.value ?? 0)}</div>
      ) : chart.chartType === 'pie' ? (
        <div className="flex gap-4 items-center">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={rows} cx="50%" cy="50%" innerRadius={36} outerRadius={60} dataKey="value" strokeWidth={0}>
                {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex-1 space-y-1">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 truncate">
                  <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate">{r.label || 'Unknown'}</span>
                </span>
                <span className="text-slate-500 tabular-nums">{fmt(r.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : chart.chartType === 'bar' ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rows} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={rows} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
