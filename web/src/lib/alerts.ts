import { zScore } from './insights'

// Daily traffic alerts. Pure detection over complete UTC days; the cron route
// supplies the data and handles delivery and de-duplication.

export type AlertKind = 'drop' | 'spike' | 'no-data'
export interface Alert {
  kind: AlertKind
  yesterday: number
  baseline: number // mean of the preceding days
  change: number | null // fractional change vs baseline (e.g. -0.62)
}

export const MIN_BASELINE = 20 // below this many views/day there is too little signal to alert on

/** `daily`: complete days, oldest first, last element = yesterday. Needs ≥ 8 days of history. */
export function detectAlert(daily: number[]): Alert | null {
  if (daily.length < 8) return null
  const yesterday = daily[daily.length - 1]
  const hist = daily.slice(0, -1)
  const baseline = hist.reduce((a, b) => a + b, 0) / hist.length
  if (baseline < MIN_BASELINE) return null

  const change = baseline ? (yesterday - baseline) / baseline : null
  if (yesterday === 0) return { kind: 'no-data', yesterday, baseline, change }

  const z = zScore(hist, yesterday)
  if (yesterday <= baseline * 0.5 && z <= -2) return { kind: 'drop', yesterday, baseline, change }
  if (yesterday >= baseline * 2 && z >= 2.5) return { kind: 'spike', yesterday, baseline, change }
  return null
}

const n = (x: number) => Math.round(x).toLocaleString('en-US')

export function alertText(siteName: string, a: Alert, dashboardUrl: string): { subject: string; body: string } {
  const pct = a.change === null ? '' : ` (${a.change >= 0 ? '+' : '−'}${Math.round(Math.abs(a.change) * 100)}% vs the usual ${n(a.baseline)}/day)`
  switch (a.kind) {
    case 'no-data':
      return {
        subject: `${siteName}: no pageviews recorded yesterday`,
        body: `${siteName} usually gets about ${n(a.baseline)} pageviews a day but recorded none yesterday. Check that the tracking script is still on the site and not blocked. ${dashboardUrl}`,
      }
    case 'drop':
      return {
        subject: `${siteName}: traffic dropped yesterday`,
        body: `${siteName} had ${n(a.yesterday)} pageviews yesterday${pct}. Open the dashboard to see which channel or page accounts for it. ${dashboardUrl}`,
      }
    case 'spike':
      return {
        subject: `${siteName}: traffic spiked yesterday`,
        body: `${siteName} had ${n(a.yesterday)} pageviews yesterday${pct}. See where it came from in the dashboard. ${dashboardUrl}`,
      }
  }
}
