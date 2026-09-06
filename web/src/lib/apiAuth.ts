import { createHash } from 'crypto'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { PLANS } from './plans'
import type { User } from '@prisma/client'

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

/** Authenticates a public API request via `Authorization: Bearer ax_live_...`.
 *  Returns the owning user if the key is valid and their plan includes API access. */
export async function authenticateApiKey(req: NextRequest): Promise<User | null> {
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

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  })

  return apiKey.user
}
