// Rule-based "why did my traffic change?" engine. Pure functions over counts, no
// I/O, no model calls: every sentence is derived from numbers the user can verify
// in the dashboard. Wording says what *accounts for* a change, never what caused it.

export interface Delta { key: string; cur: number; prev: number }
export type DimensionName = 'channel' | 'referrer' | 'page' | 'country' | 'device'
export interface Insight {
  kind: 'summary' | 'driver' | 'new' | 'lost' | 'ai' | 'anomaly' | 'note'
  tone: 'good' | 'bad' | 'neutral'
  text: string
  /** Sort weight: larger = more important. */
  weight: number
}
export interface InsightInput {
  periodLabel: string // e.g. "7 days"
  curTotal: number
  prevTotal: number
  dims: Partial<Record<DimensionName, Delta[]>>
  /** Daily pageviews, oldest first, complete days only. */
  daily?: number[]
}

const DIM_NOUN: Record<DimensionName, (k: string) => string> = {
  channel: (k) => `${k} traffic`,
  referrer: (k) => (k === '(direct)' ? 'Direct visits' : `Visits from ${k}`),
  page: (k) => `The page ${k}`,
  country: (k) => `Visitors from ${k}`,
  device: (k) => `${k[0].toUpperCase()}${k.slice(1)} visitors`,
}

const n = (x: number) => Math.round(x).toLocaleString('en-US')
const pct = (x: number) => `${Math.round(Math.abs(x) * 100)}%`

export function percentChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null
  return (cur - prev) / prev
}

export function zScore(history: number[], value: number): number {
  if (history.length < 3) return 0
  const mean = history.reduce((a, b) => a + b, 0) / history.length
  const sd = Math.sqrt(history.reduce((a, b) => a + (b - mean) ** 2, 0) / history.length)
  if (sd === 0) return value === mean ? 0 : Infinity * Math.sign(value - mean)
  return (value - mean) / sd
}

export function buildInsights(input: InsightInput): Insight[] {
  const { curTotal, prevTotal, dims, daily, periodLabel } = input
  const out: Insight[] = []

  if (curTotal < 20 && prevTotal < 20) {
    return [{ kind: 'note', tone: 'neutral', weight: 1, text: `Not enough traffic yet to explain changes (fewer than 20 pageviews in each of the last two ${periodLabel} periods).` }]
  }

  const diff = curTotal - prevTotal
  const ch = percentChange(curTotal, prevTotal)
  const up = diff >= 0
  const significant = Math.abs(diff) >= Math.max(10, prevTotal * 0.05)

  if (ch === null) {
    out.push({ kind: 'summary', tone: 'good', weight: 100, text: `${n(curTotal)} pageviews in the last ${periodLabel}, up from none in the previous period.` })
  } else if (!significant) {
    out.push({ kind: 'summary', tone: 'neutral', weight: 100, text: `Traffic is steady: ${n(curTotal)} pageviews in the last ${periodLabel} (${ch >= 0 ? '+' : '−'}${pct(ch)} vs the previous ${periodLabel}).` })
  } else {
    out.push({
      kind: 'summary', tone: up ? 'good' : 'bad', weight: 100,
      text: `Pageviews ${up ? 'rose' : 'fell'} ${pct(ch)} (${up ? '+' : '−'}${n(Math.abs(diff))}) to ${n(curTotal)} versus the previous ${periodLabel}.`,
    })
  }

  // What accounts for the change: the biggest same-direction contributors per dimension.
  if (significant) {
    for (const dim of Object.keys(dims) as DimensionName[]) {
      const rows = dims[dim] ?? []
      const same = rows
        .map((r) => ({ ...r, d: r.cur - r.prev }))
        .filter((r) => Math.sign(r.d) === Math.sign(diff) && r.prev + r.cur > 0)
        .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
      const top = same[0]
      if (!top) continue
      const share = top.d / diff
      if (share < 0.3 || Math.abs(top.d) < 5) continue
      // A lone key that is the whole dimension (e.g. one country) says nothing new.
      if (rows.length < 2 && dim !== 'channel') continue
      out.push({
        kind: 'driver', tone: up ? 'good' : 'bad', weight: 50 + share * 40,
        text: `${DIM_NOUN[dim](top.key)} accounts for ${pct(share)} of the ${up ? 'increase' : 'drop'} (${top.d > 0 ? '+' : '−'}${n(Math.abs(top.d))} pageviews).`,
      })
    }
  }

  // New and vanished sources.
  const refs = dims.referrer ?? []
  const minNew = Math.max(5, curTotal * 0.02)
  for (const r of refs.filter((r) => r.prev === 0 && r.cur >= minNew && r.key !== '(direct)').sort((a, b) => b.cur - a.cur).slice(0, 2)) {
    out.push({ kind: 'new', tone: 'good', weight: 40 + Math.min(r.cur, 40) / 4, text: `New referrer: ${r.key} sent ${n(r.cur)} pageviews (none in the previous period).` })
  }
  const minLost = Math.max(5, prevTotal * 0.05)
  for (const r of refs.filter((r) => r.cur === 0 && r.prev >= minLost && r.key !== '(direct)').sort((a, b) => b.prev - a.prev).slice(0, 2)) {
    out.push({ kind: 'lost', tone: 'bad', weight: 40 + Math.min(r.prev, 40) / 4, text: `${r.key} sent ${n(r.prev)} pageviews last period and none this period.` })
  }

  // AI assistants.
  const ai = (dims.channel ?? []).find((c) => c.key === 'AI assistants')
  if (ai && ai.cur >= 3) {
    const c = percentChange(ai.cur, ai.prev)
    out.push({
      kind: 'ai', tone: 'neutral', weight: 45,
      text: `AI assistants sent ${n(ai.cur)} pageviews${c === null ? ' (a new channel for you)' : c === 0 ? '' : ` (${c > 0 ? '+' : '−'}${pct(c)} vs the previous period)`}.`,
    })
  }

  // Yesterday vs recent days.
  if (daily && daily.length >= 8) {
    const last = daily[daily.length - 1]
    const hist = daily.slice(0, -1)
    const mean = hist.reduce((a, b) => a + b, 0) / hist.length
    const z = zScore(hist, last)
    if (Math.abs(z) >= 2.5 && Math.abs(last - mean) >= Math.max(10, mean * 0.25)) {
      const high = last > mean
      out.push({
        kind: 'anomaly', tone: high ? 'good' : 'bad', weight: 70,
        text: `Yesterday had ${n(last)} pageviews — ${high ? 'unusually high' : 'unusually low'} compared with a typical ${n(mean)} over the prior ${hist.length} days.`,
      })
    }
  }

  return out.sort((a, b) => b.weight - a.weight).slice(0, 6)
}
