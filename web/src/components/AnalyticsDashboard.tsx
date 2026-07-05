'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatsCards } from './StatsCards'
import { PageviewsChart } from './PageviewsChart'
import { TopList } from './TopList'
import { DeviceBreakdown } from './DeviceBreakdown'
import { LiveBadge } from './LiveBadge'
import { CampaignsTable } from './CampaignsTable'
import { SharePanel } from './SharePanel'
import { CustomCharts } from './CustomCharts'
import { DataStorageInfo } from './DataStorageInfo'
import { EncryptionPanel } from './EncryptionPanel'

type Period = 'today' | '7d' | '30d'
type Tab = 'overview' | 'campaigns' | 'custom' | 'privacy' | 'encryption' | 'share'

interface AnalyticsData {
  totals:     { total_views: number; unique_visitors: number }
  prevTotals: { total_views: number; unique_visitors: number }
  chart:      Array<{ date: string; views: number; visitors: number }>
  pages:      Array<{ url: string; views: number; visitors: number }>
  referrers:  Array<{ referrer: string; views: number }>
  devices:    Array<{ device_type: string; views: number }>
  browsers:   Array<{ browser: string; views: number }>
  campaigns:  Array<{ source: string; medium: string; campaign: string; visits: number; visitors: number }>
  events:     Array<{ event_name: string; count: number; unique_visitors: number }>
}

interface Props {
  siteId: string
  siteName: string
  trackingId: string
  isPublic: boolean
  publicToken: string | null
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d',    label: '7 days' },
  { key: '30d',   label: '30 days' },
]

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview',   label: 'Overview' },
  { key: 'campaigns',  label: 'Campaigns & Events' },
  { key: 'custom',     label: 'Custom Charts' },
  { key: 'privacy',    label: 'Privacy & Data' },
  { key: 'encryption', label: 'Encryption' },
  { key: 'share',      label: 'Share & API' },
]

export function AnalyticsDashboard({ siteId, siteName, trackingId, isPublic, publicToken }: Props) {
  const [period, setPeriod] = useState<Period>('7d')
  const [tab, setTab]       = useState<Tab>('overview')
  const [data, setData]     = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/analytics/${siteId}?period=${period}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError('Could not load analytics data.')
    } finally {
      setLoading(false)
    }
  }, [siteId, period])

  useEffect(() => { fetchData() }, [fetchData])

  function handleExport() {
    window.open(`/api/analytics/${siteId}/export?period=${period}`, '_blank')
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex gap-1 border-b border-slate-200 w-full overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls row — only on overview tab */}
      {tab === 'overview' && (
        <div className="flex items-center justify-between mt-4 mb-6">
          <LiveBadge siteId={siteId} />
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
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
        </div>
      )}

      {/* Period selector for campaigns tab */}
      {tab === 'campaigns' && (
        <div className="flex justify-end mt-4 mb-6">
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
      )}

      {error && (
        <div className="card p-4 text-center text-red-600 text-sm mb-6">{error}</div>
      )}

      {/* ── Overview tab ─────────────────────────────────── */}
      {tab === 'overview' && (
        loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => <div key={i} className="card p-6 h-28 animate-pulse bg-slate-100" />)}
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
        ) : null
      )}

      {/* ── Campaigns & Events tab ───────────────────────── */}
      {tab === 'campaigns' && (
        loading ? (
          <div className="space-y-4">
            <div className="card p-6 h-48 animate-pulse bg-slate-100" />
            <div className="card p-6 h-48 animate-pulse bg-slate-100" />
          </div>
        ) : data ? (
          <CampaignsTable campaigns={data.campaigns} events={data.events} />
        ) : null
      )}

      {/* ── Custom Charts tab ────────────────────────────── */}
      {tab === 'custom' && <CustomCharts siteId={siteId} />}

      {/* ── Privacy & Data tab ───────────────────────────── */}
      {tab === 'privacy' && <DataStorageInfo />}

      {/* ── Encryption tab ───────────────────────────────── */}
      {tab === 'encryption' && (
        <EncryptionPanel
          siteId={siteId}
          trackingId={trackingId}
          eventNames={data?.events.map((e) => e.event_name) ?? []}
        />
      )}

      {/* ── Share & API tab ──────────────────────────────── */}
      {tab === 'share' && (
        <div className="mt-4">
          <SharePanel
            siteId={siteId}
            initialIsPublic={isPublic}
            initialPublicToken={publicToken}
          />
        </div>
      )}
    </div>
  )
}
