import { createClient } from '@clickhouse/client'

const globalForCh = globalThis as unknown as {
  ch: ReturnType<typeof createClient> | undefined
}

export const ch =
  globalForCh.ch ??
  createClient({
    url: process.env.CLICKHOUSE_HOST ?? 'http://localhost:8123',
    database: process.env.CLICKHOUSE_DB ?? 'analytics',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
    request_timeout: 30_000,
    clickhouse_settings: {
      async_insert: 0,
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForCh.ch = ch
}
