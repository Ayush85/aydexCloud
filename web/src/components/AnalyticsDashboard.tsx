'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatsCards } from './StatsCards'
import { PageviewsChart } from './PageviewsChart'
import { TopList } from './TopList'
import { DeviceBreakdown } from './DeviceBreakdown'

type Period = 'today' | '7d' | '30d'

interface AnalyticsData {
  totals: { total_views: number; unique_visitors: number }
  chart: Array<{ date: string; views: number; visitors: number }>
  pages: Array<{ url: string; views: number; visitors: number }>
  referrers: Array<{ referrer: string; views: number }>
  devices: Array<{ device_type: string; views: number }>
  browsers: Array<{ browser: string; views: number }>
}

export function AnalyticsDashboard({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [period, setPeriod] = useState<Period>('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/analytics/${siteId}?period=${period}`)
      if (!res.ok) throw new Error('Failed to load analytics')
      setData(await res.json())
    } catch {
      setError('Could not load analytics data.')
    } finally {
      setLoading(false)
    }
  }, [siteId, period])

  useEffect(() => { fetchData() }, [fetchData])

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d',    label: '7 days' },
    { key: '30d',   label: '30 days' },
  ]

  return (
    <div>
      {/* Period selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">{siteName}</h2>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                period === p.key
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card p-4 text-center text-red-600 text-sm mb-6">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="card p-6 h-24 animate-pulse bg-slate-100" />
            ))}
          </div>
          <div className="card p-6 h-64 animate-pulse bg-slate-100" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <StatsCards totals={data.totals} />
          <PageviewsChart data={data.chart} period={period} />
          <div className="grid md:grid-cols-2 gap-6">
            <TopList
              title="Top pages"
              rows={data.pages.map((p) => ({ label: p.url, value: p.views }))}
              total={data.totals.total_views}
            />
            <TopList
              title="Top referrers"
              rows={data.referrers.map((r) => ({ label: r.referrer || 'Direct / none', value: r.views }))}
              total={data.totals.total_views}
              emptyMsg="No referrers yet"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <DeviceBreakdown title="Devices" data={data.devices.map((d) => ({ name: d.device_type, value: d.views }))} />
            <DeviceBreakdown title="Browsers" data={data.browsers.map((b) => ({ name: b.browser, value: b.views }))} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
