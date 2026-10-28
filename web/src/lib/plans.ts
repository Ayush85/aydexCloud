import { PlanTier } from '@prisma/client'

export interface PlanLimits {
  tier: PlanTier
  label: string
  price: number
  maxSites: number
  maxPageviews: number
  apiAccess: boolean
  priceEnvVar: string | null
  features: string[]
}

export const PLANS: Record<PlanTier, PlanLimits> = {
  FREE: {
    tier: 'FREE',
    label: 'Free',
    price: 0,
    maxSites: 1,
    maxPageviews: 10_000,
    apiAccess: true,
    priceEnvVar: null,
    features: ['Real-time dashboard', 'Cookieless tracking', 'REST API + MCP server', 'Community support'],
  },
  STARTER: {
    tier: 'STARTER',
    label: 'Starter',
    price: 7,
    maxSites: 3,
    maxPageviews: 100_000,
    apiAccess: true,
    priceEnvVar: 'STRIPE_PRICE_STARTER',
    features: ['Everything in Free', 'Email reports', 'GDPR badge', 'Email support'],
  },
  PRO: {
    tier: 'PRO',
    label: 'Pro',
    price: 19,
    maxSites: 10,
    maxPageviews: 1_000_000,
    apiAccess: true,
    priceEnvVar: 'STRIPE_PRICE_PRO',
    features: ['Everything in Starter', 'Custom events', 'Traffic alerts', 'Priority email support'],
  },
  AGENCY: {
    tier: 'AGENCY',
    label: 'Agency',
    price: 49,
    maxSites: Infinity,
    maxPageviews: 10_000_000,
    apiAccess: true,
    priceEnvVar: 'STRIPE_PRICE_AGENCY',
    features: ['Everything in Pro', 'White-label option', 'Team seats', 'Priority support'],
  },
}

export function planFromPriceId(priceId: string): PlanTier | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.priceEnvVar && process.env[plan.priceEnvVar] === priceId) return plan.tier
  }
  return null
}
