import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequestWithAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(_req: NextRequestWithAuth) {
    const res = NextResponse.next()
    // Never let the browser (or bfcache) replay a signed-in page after sign-out.
    res.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
    return res
  },
  {
    // Without this, withAuth sends signed-out users to NextAuth's built-in page instead of ours.
    pages: { signIn: '/auth/signin' },
  }
)

export const config = {
  matcher: ['/dashboard/:path*'],
}
