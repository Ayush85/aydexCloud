import { NextRequest, NextResponse } from 'next/server'
import { syncAllQuotas } from '@/lib/quota'
import { validCronAuth } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!validCronAuth(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ synced: await syncAllQuotas() })
}
export const GET = POST
