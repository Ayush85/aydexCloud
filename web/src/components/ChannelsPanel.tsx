'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TopList } from './TopList'
import type { DashboardData } from './dashboardTypes'

// Fixed colour per channel so a channel keeps its colour across periods and sites.
export const CHANNEL_COLORS: Record<string, string> = {
  'AI assistants': '#8b5cf6',
  Search: '#22c55e',
  Social: '#06b6d4',
  Email: '#f59e0b',
  Paid: '#ef4444',
  Referral: '#6366f1',
  Direct: '#94a3b8',
}

export function ChannelsPanel({ channels, ai, total }: { channels: DashboardData['channels']; ai: DashboardData['aiReferrals']; total: number }) {
  const rows = channels.map((c) => ({ name: c.channel, value: Number(c.views) }))
  const sum = rows.reduce((a, r) => a + r.value, 0)
  const aiTotal = ai.reduce((a, r) => a + Number(r.views), 0)
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-5">
        <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-3">Traffic channels</h3>
        {rows.length === 0 ? (
          <p className="text-slate-400 dark:text-zinc-500 text-sm py-8 text-center">No traffic yet</p>
        ) : (
          <div className="flex items-center gap-5">
            <div className="relative shrink-0" style={{ width: 150, height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rows} dataKey="value" innerRadius={46} outerRadius={70} paddingAngle={2} strokeWidth={0}>
                    {rows.map((r) => <Cell key={r.name} fill={CHANNEL_COLORS[r.name] ?? '#64748b'} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12, color: 'inherit' }}
                    formatter={(v: number, n: string) => [`${v.toLocaleString()} (${Math.round((v / sum) * 100)}%)`, n]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-slate-900 dark:text-zinc-100">{sum.toLocaleString()}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-zinc-500">views</span>
              </div>
            </div>
            <ul className="flex-1 space-y-1.5 min-w-0">
              {rows.map((r) => (
                <li key={r.name} className="flex items-center justify-between text-sm gap-3">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 truncate">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: CHANNEL_COLORS[r.name] ?? '#64748b' }} />
                    {r.name}
                  </span>
                  <span className="tabular-nums text-slate-500 dark:text-zinc-400">{Math.round((r.value / sum) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <TopList
        title={`From AI assistants${aiTotal ? ` · ${aiTotal.toLocaleString()} views` : ''}`}
        rows={ai.map((r) => ({ label: r.source || '(unknown)', value: Number(r.views) }))}
        total={aiTotal || total || 1}
        emptyMsg="No visits from ChatGPT, Perplexity, Claude, Gemini or Copilot yet"
      />
    </div>
  )
}
