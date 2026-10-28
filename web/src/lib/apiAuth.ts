import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'
import { redis } from './redis'
import { PLANS } from './plans'
import type { User } from '@prisma/client'

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

/** Requests per minute per API key. */
export const API_RATE_LIMIT_PER_MIN = 120

/** Authenticates a public API request via `Authorization: Bearer ax_live_...`.
 *  Returns the owning user and key id if the key is valid and the plan allows API use. */
export async function authenticateApiKeyFull(
  req: NextRequest
): Promise<{ user: User; keyId: string } | null> {
  const header = req.headers.get('authorization') ?? ''
  const match = header.match(/^Bearer\s+(ax_live_[a-f0-9]{32})$/)
  if (!match) return null

  const keyHash = hashApiKey(match[1])
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  })
  if (!apiKey) return null
  if (!PLANS[apiKey.user.planTier].apiAccess) return null

  // Fire-and-forget: bookkeeping must never slow down or fail the request.
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined)

  return { user: apiKey.user, keyId: apiKey.id }
}

export async function authenticateApiKey(req: NextRequest): Promise<User | null> {
  return (await authenticateApiKeyFull(req))?.user ?? null
}

/** Fixed-window per-key limiter. Fails open if Redis is unavailable. */
export async function overRateLimit(keyId: string): Promise<boolean> {
  try {
    const key = `apirl:${keyId}:${Math.floor(Date.now() / 60_000)}`
    const n = await redis.incr(key)
    if (n === 1) await redis.expire(key, 70)
    return n > API_RATE_LIMIT_PER_MIN
  } catch {
    return false
  }
}

/** One-stop guard for /api/v1 routes: 401 on a bad key, 429 when over the limit. */
export async function requireApiUser(
  req: NextRequest
): Promise<{ user: User } | { response: NextResponse }> {
  const auth = await authenticateApiKeyFull(req)
  if (!auth) {
    return {
      response: NextResponse.json(
        { error: 'Invalid or missing API key. Send "Authorization: Bearer ax_live_..." (create one under Settings → API keys).' },
        { status: 401 }
      ),
    }
  }
  if (await overRateLimit(auth.keyId)) {
    return {
      response: NextResponse.json(
        { error: `Rate limit exceeded (${API_RATE_LIMIT_PER_MIN} requests/minute per key).` },
        { status: 429, headers: { 'Retry-After': '60' } }
      ),
    }
  }
  return { user: auth.user }
}
