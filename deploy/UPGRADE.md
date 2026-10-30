# Upgrading to the "ultimate" release

Everything is additive: no destructive migrations, existing events keep working.

```bash
cd ~/aydexCloud
git fetch origin && git checkout feature/ultimate && git pull
docker compose up -d --build web tracker      # rebuilds both images
docker compose logs --tail=50 web tracker
```

What happens on start

| Component | Change |
|---|---|
| web (`entrypoint.sh`) | `prisma db push` (without `--accept-data-loss`) adds the `funnels` table only |
| tracker | creates `analytics.imported_daily` if missing; serves the new `script.js` (also at `/s.js`, collector also at `/e`) |
| ClickHouse | `analytics.pageviews` unchanged — new signals are ordinary rows whose `event_name` starts with `_` |

Notes

- **Cache:** the old script is cached for up to 1 h (`max-age=3600`). Until a visitor's browser refreshes it they keep sending old-style pageviews, which still work; time-on-page and behavior data appear as the new script rolls out.
- **Quota:** internal `_` events are not counted against the monthly pageview quota or the live-visitor count.
- **Bots/spam:** bot user-agents and a built-in referrer-spam list are dropped at the collector. Add more with `SPAM_REFERRERS=host1,host2` in the tracker's environment.
- **API keys:** the REST API and MCP server are now available on every plan; keys are rate limited to 120 requests/minute.
- **Rollback:** `git checkout deploy/self-hosted && docker compose up -d --build web tracker`. The extra table and ClickHouse rows are harmless to the old version.
- **Quick check after deploy:** open a tracked page, wait ~10 s, then in the dashboard Overview confirm *Avg. time on page* fills in; `curl -s https://t.aydex.cloud/script.js | sha256sum` should match `/privacy-proof`.

## Growth release (alerts, webhooks, annotations, install guides)

```bash
cd ~/aydexCloud && git pull
docker compose up -d --build web tracker
docker compose exec web npx prisma db push      # adds annotations table + site alert/webhook columns (non-destructive)
docker compose up -d --force-recreate cron      # picks up the new daily alerts line in ops/crontab
```

- Traffic alerts need the Pro or Agency plan. Slack/Discord webhooks work on every plan.
- Alerts skip sites with under ~20 pageviews/day (too little signal).
