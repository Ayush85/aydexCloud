'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatsCards } from '@/components/StatsCards'
import { PageviewsChart } from '@/components/PageviewsChart'
import { TopList } from '@/components/TopList'
import { DeviceBreakdown } from '@/components/DeviceBreakdown'
import Link from 'next/link'

type Period = 'today' | '7d' | '30d'

interface ShareData {
  site: { name: string; domain: string }
  totals: { total_views: number; unique_visitors: number }
  prevTotals: { total_views: number; unique_visitors: number }
  chart: Array<{ date: string; views: number; visitors: number }>
  pages: Array<{ url: string; views: number; visitors: number }>
  referrers: Array<{ referrer: string; views: number }>
  devices: Array<{ device_type: string; views: number }>
}

export default function SharePage({ params }: { params: { token: string } }) {
  const [period, setPeriod] = useState<Period>('7d')
  const [data, setData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/share/${params.token}?period=${period}`)
      if (res.status === 404) { setError('This dashboard is not public or does not exist.'); return }
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError('Could not load analytics.')
    } finally {
      setLoading(false)
    }
  }, [params.token, period])

  useEffect(() => { fetchData() }, [fetchData])

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d',    label: '7 days' },
    { key: '30d',   label: '30 days' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data && (
              <>
                <span className="font-semibold text-slate-900">{data.site.name}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 text-sm">{data.site.domain}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded-full">Public dashboard</span>
            <Link href="/" className="text-brand-600 font-medium hover:underline">aydex.cloud</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error ? (
          <div className="card p-12 text-center">
            <p className="text-slate-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-slate-900">
                {data ? `${data.site.name} — Analytics` : 'Loading…'}
              </h1>
              <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
                {periods.map((p) => (
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

            {loading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((i) => <div key={i} className="card p-6 h-24 animate-pulse bg-slate-100" />)}
                </div>
                <div className="card p-6 h-64 animate-pulse bg-slate-100" />
              </div>
            ) : data ? (
              <div className="space-y-6">
                <StatsCards totals={data.totals} prevTotals={data.prevTotals} />
                <PageviewsChart data={data.chart} period={period} />
                <div className="grid md:grid-cols-2 gap-6">
                  <TopList
                    title="Top pages"
                    rows={data.pages.map((p) => ({ label: p.url, value: p.views }))}
                    total={data.totals.total_views}
                  />
                  <TopList
                    title="Top referrers"
                    rows={data.referrers.map((r) => ({ label: r.referrer || 'Direct', value: r.views }))}
                    total={data.totals.total_views}
                    emptyMsg="No referrers"
                  />
                </div>
                <DeviceBreakdown
                  title="Devices"
                  data={data.devices.map((d) => ({ name: d.device_type, value: d.views }))}
                />
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
