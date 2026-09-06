import { Resend } from 'resend'

const globalForResend = globalThis as unknown as { resend: Resend | undefined }

// `||`, not `??` — an intentionally-empty RESEND_API_KEY (e.g. unset in .env)
// must fall back too, or the SDK throws at import time before sendWeeklyDigest
// ever gets a chance to no-op on a missing key.
const resend =
  globalForResend.resend ?? new Resend(process.env.RESEND_API_KEY || 're_placeholder')

if (process.env.NODE_ENV !== 'production') {
  globalForResend.resend = resend
}

export interface SiteDigest {
  name: string
  views: number
  visitors: number
}

export async function sendWeeklyDigest(
  to: string,
  sites: SiteDigest[]
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return // no-op until configured

  const rows = sites
    .map(
      (s) =>
        `<tr><td style="padding:8px 0;color:#0f172a">${s.name}</td><td style="padding:8px 0;text-align:right">${s.views.toLocaleString()}</td><td style="padding:8px 0;text-align:right">${s.visitors.toLocaleString()}</td></tr>`
    )
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#0f172a">Your week on aydex.cloud</h2>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="text-align:left;color:#64748b;font-size:12px;text-transform:uppercase">
            <th style="padding:8px 0">Site</th><th style="text-align:right">Views</th><th style="text-align:right">Visitors</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">
        You're receiving this because email digests are enabled on your account.
        Turn them off any time in your billing settings.
      </p>
    </div>
  `

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'aydex.cloud <digest@aydex.cloud>',
    to,
    subject: 'Your weekly aydex.cloud digest',
    html,
  })
}
