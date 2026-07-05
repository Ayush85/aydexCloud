'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChartCard, type ChartConfig } from './ChartCard'

interface Props {
  siteId: string
}

const METRIC_OPTIONS = [
  { value: 'views', label: 'Pageviews' },
  { value: 'visitors', label: 'Unique visitors' },
]

const DIMENSION_OPTIONS = [
  { value: 'none', label: 'None (single number)' },
  { value: 'date', label: 'Over time' },
  { value: 'url', label: 'Page' },
  { value: 'referrer', label: 'Referrer' },
  { value: 'browser', label: 'Browser' },
  { value: 'os', label: 'OS' },
  { value: 'device_type', label: 'Device type' },
  { value: 'event_name', label: 'Event name' },
]

const FILTER_FIELD_OPTIONS = DIMENSION_OPTIONS.filter((d) => d.value !== 'none')

const CHART_TYPE_OPTIONS = [
  { value: 'line', label: 'Line' },
  { value: 'bar', label: 'Bar' },
  { value: 'pie', label: 'Pie' },
  { value: 'number', label: 'Number' },
]

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
]

export function CustomCharts({ siteId }: Props) {
  const [charts, setCharts] = useState<ChartConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [metric, setMetric] = useState('views')
  const [dimension, setDimension] = useState('date')
  const [chartType, setChartType] = useState('line')
  const [filterField, setFilterField] = useState('')
  const [filterValue, setFilterValue] = useState('')

  const fetchCharts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/charts/${siteId}`)
      const json = await res.json()
      setCharts(json.charts ?? [])
    } finally {
      setLoading(false)
    }
  }, [siteId])

  useEffect(() => { fetchCharts() }, [fetchCharts])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/charts/${siteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          metric,
          dimension,
          chartType,
          filterField: filterField || null,
          filterValue: filterField ? filterValue : null,
        }),
      })
      if (res.ok) {
        setName(''); setFilterField(''); setFilterValue('')
        setShowForm(false)
        await fetchCharts()
      }
    } finally {
      setSaving(false)
    }
  }

  function handleDeleted(id: string) {
    setCharts((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary text-sm">
          {showForm ? 'Cancel' : '+ New chart'}
        </button>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                period === p.key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Chart name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Views by browser"
              required
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Metric</label>
              <select className="input" value={metric} onChange={(e) => setMetric(e.target.value)}>
                {METRIC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Group by</label>
              <select className="input" value={dimension} onChange={(e) => setDimension(e.target.value)}>
                {DIMENSION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Chart type</label>
              <select className="input" value={chartType} onChange={(e) => setChartType(e.target.value)}>
                {CHART_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Filter by (optional)</label>
              <select className="input" value={filterField} onChange={(e) => setFilterField(e.target.value)}>
                <option value="">No filter</option>
                {FILTER_FIELD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Filter value</label>
              <input
                className="input"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="e.g. mobile"
                disabled={!filterField}
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Save chart'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map((i) => <div key={i} className="card p-6 h-56 animate-pulse bg-slate-100" />)}
        </div>
      ) : charts.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">
          <p className="mb-2 text-2xl">📊</p>
          No custom charts yet. Build your own from any metric, dimension, and filter.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {charts.map((c) => (
            <ChartCard key={c.id} chart={c} siteId={siteId} period={period} onDelete={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  )
}
