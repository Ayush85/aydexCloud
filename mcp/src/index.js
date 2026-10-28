#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { AydexClient, REPORTS, PERIODS } from './api.js'

const client = new AydexClient({
  apiKey: process.env.AYDEX_API_KEY,
  baseUrl: process.env.AYDEX_URL || 'https://aydex.cloud',
})

const server = new McpServer({ name: 'aydex', version: '0.1.0' })

const text = (value) => ({
  content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
})
const fail = (err) => ({ isError: true, content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }] })

const site = z.string().optional().describe('Site id, name or domain. Optional when you only have one site.')
const period = z.enum(PERIODS).default('7d').describe('Rolling window; compared against the equal window before it.')

server.registerTool(
  'list_sites',
  { description: 'List the websites you track in aydex.cloud.', inputSchema: {} },
  async () => { try { return text(await client.listSites()) } catch (e) { return fail(e) } }
)

server.registerTool(
  'why_did_traffic_change',
  {
    description:
      'Explains what accounts for the change in pageviews versus the previous period (channels, referrers, pages, countries, devices, new/lost sources, AI-assistant traffic, anomalies). Every statement is computed from the data.',
    inputSchema: { site, period },
  },
  async ({ site: s, period: p }) => {
    try {
      const r = await client.report(s, 'insights', p)
      return text({ site: r.site.name, period: p, insights: r.data.map((i) => i.text) })
    } catch (e) { return fail(e) }
  }
)

server.registerTool(
  'get_report',
  {
    description: `Fetch one analytics report. Reports: ${REPORTS.join(', ')}. "behavior" has rage/dead clicks and JS errors; "revenue" attributes purchases to sources; "ai-referrals" shows visits from ChatGPT/Perplexity/Claude/Gemini/Copilot.`,
    inputSchema: { site, report: z.enum(REPORTS), period },
  },
  async ({ site: s, report, period: p }) => {
    try { const r = await client.report(s, report, p); return text({ site: r.site.name, period: p, report, data: r.data }) }
    catch (e) { return fail(e) }
  }
)

server.registerTool(
  'site_health_check',
  {
    description: 'One-call summary: totals vs previous period, bounce rate, time on page, top channels, frustration signals and errors.',
    inputSchema: { site, period },
  },
  async ({ site: s, period: p }) => {
    try {
      const [overview, channels, behavior, insights] = await Promise.all([
        client.report(s, 'overview', p), client.report(s, 'channels', p),
        client.report(s, 'behavior', p), client.report(s, 'insights', p),
      ])
      return text({
        site: overview.site.name,
        period: p,
        overview: overview.data,
        channels: channels.data,
        frustration: behavior.data.totals,
        topErrors: behavior.data.errors.slice(0, 3),
        insights: insights.data.map((i) => i.text),
      })
    } catch (e) { return fail(e) }
  }
)

await server.connect(new StdioServerTransport())
