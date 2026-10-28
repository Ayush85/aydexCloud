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
import { GoalsPanel } from './GoalsPanel'
import { InsightsPanel } from './InsightsPanel'
import { EngagementCards } from './EngagementCards'
import { ChannelsPanel } from './ChannelsPanel'
import { BehaviorPanel } from './BehaviorPanel'
import { RevenuePanel } from './RevenuePanel'
import { FunnelsPanel } from './FunnelsPanel'
import { ImportPanel } from './ImportPanel'
import { PeriodPicker } from './PeriodPicker'
import { HeatmapPanel } from './HeatmapPanel'
import { CountriesPanel } from './CountriesPanel'
import type { DashboardData, Period } from './dashboardTypes'

type Tab =
  | 'overview' | 'behavior' | 'funnels' | 'revenue' | 'campaigns' | 'goals'
  | 'custom' | 'privacy' | 'encryption' | 'share'

interface Props {
  siteId: string
  siteName: string
  trackingId: string
  isPublic: boolean
  publicToken: string | null
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview',   label: 'Overview' },
  { key: 'behavior',   label: 'Behavior' },
  { key: 'funnels',    label: 'Funnels' },
  { key: 'revenue',    label: 'Revenue' },
  { key: 'campaigns',  label: 'Campaigns & Events' },
  { key: 'goals',      label: 'Goals' },
  { key: 'custom',     label: 'Custom Charts' },
  { key: 'privacy',    label: 'Privacy & Data' },
  { key: 'encryption', label: 'Encryption' },
  { key: 'share',      label: 'Share, API & Import' },
]

// Tabs whose content depends on the selected period.
const PERIOD_TABS: Tab[] = ['overview', 'behavior', 'funnels', 'revenue', 'campaigns']

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => <div key={i} className="card p-6 h-28 animate-pulse bg-slate-100 dark:bg-zinc-800" />)}
      </div>
      <div className="card p-6 h-64 animate-pulse bg-slate-100 dark:bg-zinc-800" />
    </div>
  )
}

export function AnalyticsDashboard({ siteId, siteName, trackingId, isPublic, publicToken }: Props) {
  const [period, setPeriod] = useState<Period>('7d')
  const [tab, setTab]       = useState<Tab>('overview')
  const [data, setData]     = useState<DashboardData | null>(null)
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
        <div className="flex gap-1 border-b border-slate-200 dark:border-zinc-800 w-full overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls row */}
      {PERIOD_TABS.includes(tab) && (
        <div className="flex items-center justify-between mt-4 mb-6">
          {tab === 'overview' ? <LiveBadge siteId={siteId} /> : <span />}
          <div className="flex items-center gap-3">
            {tab === 'overview' && (
              <button onClick={handleExport} className="btn-secondary text-sm flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export CSV
              </button>
            )}
            <PeriodPicker period={period} onChange={setPeriod} />
          </div>
        </div>
      )}

      {error && (
        <div className="card p-4 text-center text-red-600 dark:text-red-400 text-sm mb-6">{error}</div>
      )}

      {/* ── Overview ─────────────────────────────────────── */}
      {tab === 'overview' && (
        loading ? <Skeleton /> : data ? (
          <div className="space-y-6">
            <InsightsPanel insights={data.insights} />
            <StatsCards totals={data.totals} prevTotals={data.prevTotals} chart={data.chart} />
            <EngagementCards cur={data.engagement} prev={data.prevEngagement} />
            <PageviewsChart data={data.chart} period={period} />
            {data.hasImported && (
              <p className="text-xs text-slate-400 dark:text-zinc-500 -mt-3">
                Includes imported history for dates before your first aydex pageview.
              </p>
            )}
            <ChannelsPanel channels={data.channels} ai={data.aiReferrals} total={Number(data.totals.total_views)} />
            <div className="grid md:grid-cols-2 gap-6">
              <TopList
                title="Top pages"
                rows={data.pages.map((p) => ({ label: p.url, value: Number(p.views) }))}
                total={Number(data.totals.total_views)}
              />
              <TopList
                title="Top referrers"
                rows={data.referrers.map((r) => ({ label: r.referrer || 'Direct / none', value: Number(r.views) }))}
                total={Number(data.totals.total_views)}
                emptyMsg="No referrers yet"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <TopList
                title="Entry pages"
                rows={data.entryPages.map((p) => ({ label: p.url, value: Number(p.sessions) }))}
                total={data.engagement.sessions}
                emptyMsg="No sessions yet"
              />
              <TopList
                title="Exit pages"
                rows={data.exitPages.map((p) => ({ label: p.url, value: Number(p.sessions) }))}
                total={data.engagement.sessions}
                emptyMsg="No sessions yet"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <DeviceBreakdown title="Devices" data={data.devices.map((d) => ({ name: d.device_type, value: Number(d.views) }))} />
              <DeviceBreakdown title="Browsers" data={data.browsers.map((b) => ({ name: b.browser, value: Number(b.views) }))} />
            </div>
            <HeatmapPanel rows={data.heatmap} />
            <CountriesPanel rows={data.countries} />
          </div>
        ) : null
      )}

      {/* ── Behavior ─────────────────────────────────────── */}
      {tab === 'behavior' && (loading ? <Skeleton /> : data ? <BehaviorPanel b={data.behavior} /> : null)}

      {/* ── Funnels ──────────────────────────────────────── */}
      {tab === 'funnels' && <FunnelsPanel siteId={siteId} period={period} />}

      {/* ── Revenue ──────────────────────────────────────── */}
      {tab === 'revenue' && (loading ? <Skeleton /> : data ? <RevenuePanel rows={data.revenue} /> : null)}

      {/* ── Campaigns & Events ───────────────────────────── */}
      {tab === 'campaigns' && (
        loading ? (
          <div className="space-y-4">
            <div className="card p-6 h-48 animate-pulse bg-slate-100 dark:bg-zinc-800" />
            <div className="card p-6 h-48 animate-pulse bg-slate-100 dark:bg-zinc-800" />
          </div>
        ) : data ? (
          <CampaignsTable campaigns={data.campaigns} events={data.events} />
        ) : null
      )}

      {/* ── Goals ────────────────────────────────────────── */}
      {tab === 'goals' && (
        loading ? (
          <div className="card p-6 h-48 animate-pulse bg-slate-100 dark:bg-zinc-800" />
        ) : data ? (
          <GoalsPanel siteId={siteId} goals={data.goals} onChange={fetchData} />
        ) : null
      )}

      {tab === 'custom' && <CustomCharts siteId={siteId} />}
      {tab === 'privacy' && <DataStorageInfo />}

      {tab === 'encryption' && (
        <EncryptionPanel
          siteId={siteId}
          trackingId={trackingId}
          eventNames={data?.events.map((e) => e.event_name) ?? []}
        />
      )}

      {/* ── Share, API & Import ──────────────────────────── */}
      {tab === 'share' && (
        <div className="mt-4 space-y-6">
          <SharePanel siteId={siteId} initialIsPublic={isPublic} initialPublicToken={publicToken} />
          <ImportPanel siteId={siteId} />
          <div className="card p-5 text-sm text-slate-600 dark:text-zinc-400 space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100">REST API &amp; MCP server</h3>
            <p>Create a key under Settings → API keys (available on every plan), then:</p>
            <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs overflow-x-auto">{`curl -H "Authorization: Bearer ax_live_…" \\
  https://aydex.cloud/api/v1/sites/${siteId}/insights?period=7d`}</pre>
            <p>
              Reports: overview, timeseries, pages, referrers, channels, ai-referrals, countries, devices, browsers,
              campaigns, events, engagement, entry-exit, behavior, revenue, funnels, insights. Periods: today, 7d, 30d, 90d.
              See <code>mcp/README.md</code> in the repository to ask Claude about your traffic.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
