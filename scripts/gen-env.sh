#!/bin/sh
# Usage: ./scripts/gen-env.sh app.example.com t.example.com > .env
# Generates a self-hosted .env with fresh secrets. Refuses to overwrite .env.
set -e
[ $# -eq 2 ] || { echo "usage: $0 APP_DOMAIN TRACKER_DOMAIN > .env" >&2; exit 1; }
[ ! -e .env ] || { echo ".env already exists, refusing" >&2; exit 1; }
APP=$1; TRK=$2
r() { openssl rand -hex 24; }
PG=$(r); CH=$(r); RD=$(r)
cat <<ENV
APP_DOMAIN=$APP
TRACKER_DOMAIN=$TRK
POSTGRES_PASSWORD=$PG
DATABASE_URL=postgresql://aydex:$PG@postgres:5432/aydex
DIRECT_URL=postgresql://aydex:$PG@postgres:5432/aydex
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://$APP
NEXT_PUBLIC_TRACKER_URL=https://$TRK
CLICKHOUSE_PASSWORD=$CH
CLICKHOUSE_HOST=http://clickhouse:8123
CLICKHOUSE_ADDR=clickhouse:9000
CLICKHOUSE_DB=analytics
CLICKHOUSE_USER=default
CLICKHOUSE_TLS=false
REDIS_PASSWORD=$RD
REDIS_URL=redis://:$RD@redis:6379
CRON_SECRET=$(openssl rand -hex 32)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PRO=
STRIPE_PRICE_AGENCY=
RESEND_API_KEY=
EMAIL_FROM=aydex.cloud <digest@$APP>
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
ENV
