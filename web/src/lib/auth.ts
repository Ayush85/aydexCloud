import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { clientIp, overLimit } from './security'

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('aydex-timing-equaliser', 12)

declare module 'next-auth' {
  interface Session {
    user: { id: string; email: string; name?: string | null }
  }
}
declare module 'next-auth/jwt' {
  interface JWT { id: string }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (typeof credentials?.email !== 'string' || typeof credentials?.password !== 'string') return null
        const email = credentials.email.trim().toLowerCase()
        if (!email || email.length > 254 || !credentials.password || credentials.password.length > 200) return null

        // Brute-force protection: per account and per IP.
        const ip = clientIp((req?.headers ?? {}) as Record<string, string | string[] | undefined>)
        if ((await overLimit(`login:email:${email}`, 10, 900)) || (await overLimit(`login:ip:${ip}`, 40, 900))) return null

        const user = await prisma.user.findUnique({ where: { email } })
        const valid = await bcrypt.compare(credentials.password, user?.passwordHash ?? DUMMY_HASH)
        if (!user || !valid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: {
    signIn: '/auth/signin',
    error:  '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
      }
      return session
    },
  },
}
