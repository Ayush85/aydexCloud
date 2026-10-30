import { timingSafeEqual } from 'crypto'

/** Constant-time string comparison (for secrets such as CRON_SECRET). */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** `Authorization: Bearer <secret>` check against an env secret. Fails closed when the secret is unset. */
export function validCronAuth(header: string | null | undefined, secret: string | undefined): boolean {
  if (!secret) return false
  return safeEqual(header ?? '', `Bearer ${secret}`)
}

/** Client IP as set by the reverse proxy (host nginx sets X-Real-IP / X-Forwarded-For). */
export function clientIp(h: { get(name: string): string | null } | Record<string, string | string[] | undefined>): string {
  const get = (n: string) => {
    const v = typeof (h as { get?: unknown }).get === 'function'
      ? (h as { get(n: string): string | null }).get(n)
      : (h as Record<string, string | string[] | undefined>)[n]
    return Array.isArray(v) ? v[0] : v ?? null
  }
  const fwd = get('x-forwarded-for')
  return (get('x-real-ip') || (fwd ? fwd.split(',')[0] : '') || 'unknown').trim().slice(0, 64)
}

/** Fixed-window limiter. Returns true when the caller is OVER the limit. Fails open if Redis is down. */
export async function overLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  try {
    const { redis } = await import('./redis') // lazy so importing this module never opens a connection
    const k = `rl:${key}`
    const n = await redis.incr(k)
    if (n === 1) await redis.expire(k, windowSec)
    return n > max
  } catch {
    return false
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** A trimmed string within [min,max] characters, or null. */
export function cleanStr(v: unknown, min: number, max: number): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length >= min && s.length <= max ? s : null
}

/** Normalises user input like "https://www.Example.com/path" to "www.example.com"; null if not a hostname. */
export function cleanDomain(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const d = v.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[/?#].*$/, '').replace(/:\d+$/, '')
  return d.length <= 253 && /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(d) ? d : null
}
