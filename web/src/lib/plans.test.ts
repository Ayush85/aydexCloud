import { describe, it, expect, beforeEach } from 'vitest'
import { PLANS, planFromPriceId } from './plans'

describe('plan limits', () => {
  it('matches the published pricing tiers', () => {
    expect(PLANS.FREE).toMatchObject({ price: 0, maxSites: 1, maxPageviews: 10_000, apiAccess: false })
    expect(PLANS.STARTER).toMatchObject({ price: 7, maxSites: 3, maxPageviews: 100_000, apiAccess: false })
    expect(PLANS.PRO).toMatchObject({ price: 19, maxSites: 10, maxPageviews: 1_000_000, apiAccess: true })
    expect(PLANS.AGENCY).toMatchObject({ price: 49, maxPageviews: 10_000_000, apiAccess: true })
    expect(PLANS.AGENCY.maxSites).toBe(Infinity)
  })
})

describe('planFromPriceId', () => {
  beforeEach(() => {
    process.env.STRIPE_PRICE_STARTER = 'price_starter_123'
    process.env.STRIPE_PRICE_PRO = 'price_pro_123'
  })

  it('resolves a known Stripe price id to its plan tier', () => {
    expect(planFromPriceId('price_starter_123')).toBe('STARTER')
    expect(planFromPriceId('price_pro_123')).toBe('PRO')
  })

  it('returns null for an unrecognized price id', () => {
    expect(planFromPriceId('price_unknown')).toBeNull()
  })
})
