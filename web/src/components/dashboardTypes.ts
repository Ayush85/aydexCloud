// Response shape of /api/analytics/[siteId] — derived from the server so the two never drift.
export type DashboardData = Awaited<ReturnType<typeof import('@/lib/reports').getDashboard>>
export type Period = 'today' | '7d' | '30d' | '90d'

export function fmtDuration(seconds: number): string {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s ? `${m}m ${s}s` : `${m}m`
}
