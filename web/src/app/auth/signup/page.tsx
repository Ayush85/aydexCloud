'use client'

import { Logo } from '@/components/Logo'
import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Registration failed.')
      setLoading(false)
      return
    }

    await signIn('credentials', { email, password, redirect: false })

    if (plan && ['starter', 'pro', 'agency'].includes(plan)) {
      try {
        const checkoutRes = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: plan.toUpperCase() }),
        })
        const checkout = await checkoutRes.json()
        if (checkoutRes.ok && checkout.url) {
          window.location.href = checkout.url
          return
        }
      } catch {
        // fall through to dashboard — billing may not be configured yet
      }
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex"><Logo size={36} /></Link>
          <p className="mt-2 text-slate-500 text-sm dark:text-zinc-400">Create your free account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-zinc-300">Name</label>
              <input
                type="text"
                className="input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-zinc-300">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-zinc-300">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account — it\'s free'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-sm text-slate-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  )
}
