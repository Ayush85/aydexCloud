import { TopList } from './TopList'
import type { DashboardData } from './dashboardTypes'

export function ChannelsPanel({ channels, ai, total }: { channels: DashboardData['channels']; ai: DashboardData['aiReferrals']; total: number }) {
  const aiTotal = ai.reduce((a, r) => a + Number(r.views), 0)
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <TopList
        title="Traffic channels"
        rows={channels.map((c) => ({ label: c.channel, value: Number(c.views) }))}
        total={total}
        emptyMsg="No traffic yet"
      />
      <div>
        <TopList
          title={`From AI assistants${aiTotal ? ` · ${aiTotal.toLocaleString()} views` : ''}`}
          rows={ai.map((r) => ({ label: r.source || '(unknown)', value: Number(r.views) }))}
          total={aiTotal || 1}
          emptyMsg="No visits from ChatGPT, Perplexity, Claude, Gemini or Copilot yet"
        />
      </div>
    </div>
  )
}
