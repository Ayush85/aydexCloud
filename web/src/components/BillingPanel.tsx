'use client'

import { useState } from 'react'
import type { PlanTier } from '@prisma/client'
import { PLANS } from '@/lib/plans'

interface Usage {
  sitesUsed: number
  pageviewsUsed: number
}

interface Props {
  planTier: PlanTier
  hasStripeCustomer: boolean
  emailDigestEnabled: boolean
  usage: Usage
  limits: { maxSites: number; maxPageviews: number }
}

const TIER_ORDER: PlanTier[] = ['FREE', 'STARTER', 'PRO', 'AGENCY']

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-brand-500'
}

export function BillingPanel({ planTier, hasStripeCustomer, emailDigestEnabled, usage, limits }: Props) {
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [digestEnabled, setDigestEnabled] = useState(emailDigestEnabled)
  const [error, setError] = useState('')

  async function upgrade(tier: PlanTier) {
    setLoadingTier(tier)
    setError('')
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: tier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.')
      setLoadingTier(null)
    }
  }

  async function manageBilling() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal.')
      setPortalLoading(false)
    }
  }

  async function toggleDigest() {
    const next = !digestEnabled
    setDigestEnabled(next)
    await fetch('/api/account/email-digest', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    })
  }

  const sitesPct = Number.isFinite(limits.maxSites) ? Math.min(100, (usage.sitesUsed / limits.maxSites) * 100) : 0
  const pvPct = Math.min(100, (usage.pageviewsUsed / limits.maxPageviews) * 100)

  return (
    <div className="space-y-6">
      {error && <div className="card p-4 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="card p-5 space-y-4">
        <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Usage this month</p>
        <div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
            <span>Sites</span>
            <span>{usage.sitesUsed} / {Number.isFinite(limits.maxSites) ? limits.maxSites : '∞'}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <div className={`h-full ${barColor(sitesPct)}`} style={{ width: `${sitesPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
            <span>Pageviews</span>
            <span>{usage.pageviewsUsed.toLocaleString()} / {limits.maxPageviews.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <div className={`h-full ${barColor(pvPct)}`} style={{ width: `${pvPct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TIER_ORDER.map((tier) => {
          const plan = PLANS[tier]
          return (
            <div key={tier} className={`card p-5 flex flex-col ${planTier === tier ? 'ring-2 ring-brand-500' : ''}`}>
              <p className="font-semibold text-slate-900 dark:text-zinc-100">{plan.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
                ${plan.price}<span className="text-sm text-slate-400 dark:text-zinc-500 font-normal">/mo</span>
              </p>
              <ul className="mt-4 space-y-1.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <svg className="mt-0.5 h-3 w-3 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {planTier === tier ? (
                <p className="mt-4 text-sm text-brand-600 dark:text-brand-500 font-medium">Current plan</p>
              ) : tier === 'FREE' ? (
                <p className="mt-4 text-sm text-slate-400 dark:text-zinc-500">Downgrade via billing portal</p>
              ) : (
                <button
                  onClick={() => upgrade(tier)}
                  disabled={loadingTier !== null}
                  className="mt-4 btn-primary w-full text-sm"
                >
                  {loadingTier === tier ? 'Redirecting…' : 'Upgrade'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {hasStripeCustomer && (
        <button onClick={manageBilling} disabled={portalLoading} className="btn-secondary text-sm">
          {portalLoading ? 'Opening…' : 'Manage billing & invoices'}
        </button>
      )}

      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-800 dark:text-zinc-200 text-sm">Weekly email digest</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">A summary of your sites&apos; traffic, every Monday.</p>
        </div>
        <button
          onClick={toggleDigest}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            digestEnabled ? 'bg-brand-600' : 'bg-slate-200 dark:bg-zinc-700'
          }`}
          aria-pressed={digestEnabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              digestEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
