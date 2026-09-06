import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

// Connects immediately (not lazily) — with enableOfflineQueue disabled, a lazy
// client never actually opens a connection until something calls .connect(),
// which nothing here does, so commands fail forever instead of just during
// a real outage. Connecting eagerly means the client is normally ready well
// before the first request; it still fails open (see callers' try/catch)
// during an actual Redis outage or before the initial connection completes.
export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    enableOfflineQueue: false,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}
