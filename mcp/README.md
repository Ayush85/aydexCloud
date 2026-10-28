# aydex-mcp — ask Claude about your analytics

A tiny, read-only [MCP](https://modelcontextprotocol.io) server for aydex.cloud. It talks to the public REST API with
your API key, so Claude (Desktop, Code, or any MCP client) can answer questions like
*"why did traffic drop last week?"* or *"which channel brings paying customers?"* from your real numbers.

## Setup

1. In aydex.cloud go to **Settings → API keys** and create a key (API access is on every plan).
2. `cd mcp && npm install`
3. Add the server to your MCP client, e.g. Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aydex": {
      "command": "node",
      "args": ["/absolute/path/to/aydexCloud/mcp/src/index.js"],
      "env": { "AYDEX_API_KEY": "ax_live_…", "AYDEX_URL": "https://aydex.cloud" }
    }
  }
}
```

Claude Code: `claude mcp add aydex -e AYDEX_API_KEY=ax_live_… -- node /absolute/path/to/mcp/src/index.js`

## Tools

| Tool | What it does |
|---|---|
| `list_sites` | Sites your key can see |
| `why_did_traffic_change` | Rule-based explanation of the change vs the previous period |
| `site_health_check` | Totals, bounce, time on page, channels, frustration signals, errors in one call |
| `get_report` | Any report: overview, timeseries, pages, referrers, channels, ai-referrals, countries, devices, browsers, campaigns, events, engagement, entry-exit, behavior, revenue, funnels, insights |

`site` accepts an id, name or domain. Periods: `today`, `7d`, `30d`, `90d`.

The server is read-only (GET requests only) and never sends your key anywhere except `AYDEX_URL`.
Run the tests with `npm test`.
