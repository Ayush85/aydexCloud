// Slack / Discord incoming webhooks. Only those two providers are allowed so a
// webhook URL can never be used to make the server call arbitrary hosts (SSRF).

export type WebhookKind = 'slack' | 'discord'

export function webhookKind(raw: string): WebhookKind | null {
  let u: URL
  try { u = new URL(raw) } catch { return null }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null
  if (u.hostname === 'hooks.slack.com' && /^\/services\/[A-Za-z0-9/_-]+$/.test(u.pathname)) return 'slack'
  if ((u.hostname === 'discord.com' || u.hostname === 'discordapp.com') && /^\/api\/webhooks\/\d+\/[\w-]+$/.test(u.pathname)) return 'discord'
  return null
}

/** Hides the secret part of a webhook URL for display. */
export function maskWebhook(raw: string): string {
  const k = webhookKind(raw)
  return k ? `${k === 'slack' ? 'Slack' : 'Discord'} webhook ····${raw.slice(-4)}` : 'Webhook'
}

export async function postWebhook(raw: string, text: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const kind = webhookKind(raw)
  if (!kind) return false
  try {
    const res = await fetchImpl(raw, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kind === 'slack' ? { text } : { content: text.slice(0, 1900) }),
      redirect: 'manual', // never follow redirects to another host
      signal: AbortSignal.timeout(5000),
    })
    return res.status >= 200 && res.status < 300
  } catch {
    return false
  }
}
