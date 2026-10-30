import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/plans'
import { dailyViews } from '@/lib/stats'
import { detectAlert, alertText } from '@/lib/alerts'
import { sendAlertEmail } from '@/lib/email'
import { postWebhook } from '@/lib/webhook'
import { SITE_URL } from '@/lib/site'
import { validCronAuth } from '@/lib/security'

export const dynamic = 'force-dynamic'

// Run once a day shortly after 00:00 UTC (see ops/crontab). It judges the day that just ended.
export async function GET(req: NextRequest) { return handle(req) }
export async function POST(req: NextRequest) { return handle(req) }

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!validCronAuth(req.headers.get('authorization'), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const y = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10) // yesterday (UTC)
  const sites = await prisma.site.findMany({
    where: { alertsEnabled: true },
    include: { user: true },
  })

  let alerted = 0
  for (const site of sites) {
    try {
      if (!PLANS[site.user.planTier].alerts) continue // plan was downgraded
      if (site.alertDay === y) continue // already alerted for this day

      const alert = detectAlert(await dailyViews(site.trackingId))
      if (!alert) continue

      const { subject, body } = alertText(site.name, alert, `${SITE_URL}/dashboard/${site.id}`)
      await sendAlertEmail(site.user.email, subject, body)
      if (site.webhookUrl) await postWebhook(site.webhookUrl, `*${subject}*\n${body}`)
      await prisma.site.update({ where: { id: site.id }, data: { alertDay: y } })
      alerted++
    } catch (err) {
      console.error('alerts: site failed', site.id, err) // one site must not stop the rest
    }
  }
  return NextResponse.json({ checked: sites.length, alerted })
}
