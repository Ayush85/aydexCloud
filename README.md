# aydex.cloud

Privacy-first web analytics: cookieless by default, no recordings, and built to explain *why* your traffic changed — not just chart it.

| Piece | Tech |
|---|---|
| `web/` | Next.js 14, Prisma (Postgres), NextAuth, Stripe, Recharts |
| `tracker/` | Go collector + the ~10 KB readable tracking script (`script.js`) |
| `mcp/` | MCP server so Claude can answer questions about your analytics |
| ClickHouse | Event store (`analytics.pageviews`, `analytics.imported_daily`) |
| Redis | Rate limits, monthly quota, live visitors |

## What's in it

- **Parity basics** — pageviews, visitors, sessions, bounce rate, time on page, scroll depth, entry/exit pages, countries, devices, UTM campaigns, goals, custom events, **funnels**, CSV export, public share links. Bots and referrer spam are filtered at collection time.
- **Why traffic changed** — rule-based explanations (dashboard, weekly email, API, MCP) computed from your numbers: which channel, referrer, page, country or device accounts for the change; new and lost sources; anomalies.
- **Behavior signals without recordings** — rage clicks, dead clicks, JS errors, outbound and download clicks. Only a count plus a CSS selector or scrubbed message is sent: no text, keystrokes or screenshots.
- **AI-referrer tracking** — visits from ChatGPT, Perplexity, Claude, Gemini, Copilot and others, as their own channel.
- **Revenue by source** — `aydex.track('purchase', { revenue: 49, currency: 'USD' })`, attributed to the visitor's first pageview source that day.
- **Public REST API on every plan** and an **MCP server** (`mcp/README.md`).
- **Ad-block resistance** — serve script and collector from your own domain (nginx / Caddy / Next.js recipes in the dashboard) with `data-endpoint`.
- **GA4 history import** — upload a GA4 daily CSV; it fills only dates before your first aydex pageview.
- **Verifiable privacy** — `/privacy-proof` hashes and statically checks the exact script served to visitors.

## Tracking snippet

```html
<script defer data-site="YOUR_TRACKING_ID" src="https://t.aydex.cloud/script.js"></script>
```

Optional attributes: `data-storage="localStorage|sessionStorage"` (+ `data-key`) for persistent encrypted visitor ids,
`data-endpoint="e"` (first-party proxy), `data-behavior="off"`, `data-spa="off"`, `data-respect-dnt="true"`; add
`data-aydex-ignore` to any element to exclude its clicks. Names starting with `_` are reserved for internal signals.

## Public API

```bash
curl -H "Authorization: Bearer ax_live_…" https://aydex.cloud/api/v1/sites
curl -H "Authorization: Bearer ax_live_…" "https://aydex.cloud/api/v1/sites/SITE_ID/insights?period=7d"
```

Reports: `overview timeseries pages referrers channels ai-referrals countries devices browsers campaigns events engagement entry-exit behavior revenue funnels insights`.
Periods: `today 7d 30d 90d`. Limit: 120 requests/minute per key (HTTP 429 beyond that). `GET /api/v1/stats/:siteId` is kept for backward compatibility.

## Definitions (so the numbers are honest)

- **Session** = one visitor id on one UTC day. Visitor ids are cookieless and rotate daily unless the site opts into `data-storage`, so a session never spans midnight.
- **Time on page** = visible-tab time per page load, averaged over page loads that reported it.
- **Dead click** is a heuristic (a button-like element that changed nothing for 800 ms); expect some false positives.
- **Imported visitors** are daily-user totals summed over days, not de-duplicated.

## Run / deploy

See `docker-compose.yml`, `deploy/` and `scripts/gen-env.sh`. Schema changes are additive (`prisma db push` creates the `funnels` table; the tracker creates `analytics.imported_daily` on start).

## Develop

```bash
cd web && npm test && npm run typecheck && npm run lint
cd tracker && go vet ./... && go test ./...
cd mcp && npm test
```
