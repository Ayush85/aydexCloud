import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { clientIp, cleanStr, overLimit, EMAIL_RE } from '@/lib/security'

export async function POST(req: NextRequest) {
  if (await overLimit(`register:${clientIp(req.headers)}`, 10, 3600)) {
    return NextResponse.json({ error: 'Too many sign-up attempts. Try again later.' }, { status: 429 })
  }
  const body = (await req.json().catch(() => null)) as { name?: unknown; email?: unknown; password?: unknown } | null

  const email = cleanStr(body?.email, 3, 254)?.toLowerCase() ?? ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const name = body?.name == null || body.name === '' ? null : cleanStr(body.name, 1, 100)

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (name === null && body?.name) {
    return NextResponse.json({ error: 'Name must be under 100 characters.' }, { status: 400 })
  }
  // bcrypt only uses the first 72 bytes; the upper bound also stops huge-password hashing abuse.
  if (password.length < 8 || Buffer.byteLength(password) > 72) {
    return NextResponse.json({ error: 'Password must be 8 to 72 characters.' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  try {
    await prisma.user.create({ data: { email, passwordHash, name } })
  } catch {
    // Lost a race with a parallel sign-up for the same email (unique constraint).
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
