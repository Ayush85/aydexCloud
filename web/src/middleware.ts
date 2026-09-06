import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequestWithAuth } from 'next-auth/middleware'

export default withAuth(function middleware(_req: NextRequestWithAuth) {
  const res = NextResponse.next()
  // Prevent the browser (and bfcache) from replaying a dashboard page after
  // sign-out when the user hits "back" — force a revalidation every time.
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  return res
})

export const config = {
  matcher: ['/dashboard/:path*'],
}
