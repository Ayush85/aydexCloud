import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { planFromPriceId } from '@/lib/plans'
import { syncUserQuotas } from '@/lib/quota'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const checkoutSession = event.data.object as Stripe.Checkout.Session
      const userId = checkoutSession.client_reference_id
      const subscriptionId = checkoutSession.subscription as string | null
      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        await applySubscription(userId, subscription)
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customer = await stripe.customers.retrieve(subscription.customer as string)
      const userId = !customer.deleted ? customer.metadata?.userId : undefined
      if (userId) {
        await applySubscription(
          userId,
          event.type === 'customer.subscription.deleted' ? null : subscription
        )
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

async function applySubscription(userId: string, subscription: Stripe.Subscription | null) {
  const priceId = subscription?.items.data[0]?.price.id
  const planTier = priceId ? planFromPriceId(priceId) ?? 'FREE' : 'FREE'

  await prisma.user.update({
    where: { id: userId },
    data: {
      planTier,
      stripeSubscriptionId: subscription?.id ?? null,
      stripeCurrentPeriodEnd: subscription
        ? new Date(subscription.current_period_end * 1000)
        : null,
    },
  })

  await syncUserQuotas(userId)
}
