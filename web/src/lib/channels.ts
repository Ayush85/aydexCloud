// Traffic-channel classification, shared by the SQL builder (ClickHouse / re2)
// and a TypeScript mirror used by unit tests and the insights engine. Both use
// the same regex sources, so they cannot drift apart.

/** Hosts are matched whole-label: "x.com" matches "x.com" and "m.x.com", never "box.com". */
const host = (d: string) => `(^|\\.)${d.replace(/\./g, '\\.')}$`

// AI assistants and AI search. Checked before search so gemini.google.com is AI, not Google.
export const AI_HOSTS = [
  'chatgpt.com', 'chat.openai.com', 'openai.com', 'perplexity.ai', 'claude.ai',
  'gemini.google.com', 'bard.google.com', 'copilot.microsoft.com', 'you.com',
  'phind.com', 'poe.com', 'deepseek.com', 'chat.deepseek.com', 'grok.com',
  'meta.ai', 'chat.mistral.ai', 'kagi.com',
]
// ChatGPT and others tag outbound links with utm_source=<name>.
export const AI_UTM_SOURCES = ['chatgpt.com', 'chatgpt', 'perplexity', 'perplexity.ai', 'claude', 'gemini', 'copilot', 'deepseek']

export const SEARCH_PATTERNS = [
  '(^|\\.)google\\.[a-z.]+$', '(^|\\.)bing\\.com$', host('duckduckgo.com'), '(^|\\.)yahoo\\.[a-z.]+$',
  host('baidu.com'), host('yandex.ru'), host('yandex.com'), host('ecosia.org'),
  host('search.brave.com'), host('startpage.com'), host('qwant.com'), host('naver.com'),
]
export const SOCIAL_HOSTS = [
  'facebook.com', 'm.facebook.com', 'l.facebook.com', 'instagram.com', 'l.instagram.com',
  't.co', 'twitter.com', 'x.com', 'linkedin.com', 'lnkd.in', 'reddit.com', 'old.reddit.com',
  'pinterest.com', 'youtube.com', 'youtu.be', 'tiktok.com', 'news.ycombinator.com',
  'threads.net', 'bsky.app', 'mastodon.social', 'quora.com', 'medium.com', 'dev.to',
  'lobste.rs', 'producthunt.com', 'discord.com', 'telegram.org', 't.me', 'whatsapp.com',
]
export const EMAIL_HOSTS = ['mail.google.com', 'outlook.live.com', 'outlook.office.com', 'mail.yahoo.com', 'mail.proton.me', 'webmail.']

export const PAID_MEDIUMS = ['cpc', 'ppc', 'paid', 'paidsearch', 'paid_social', 'paidsocial', 'display', 'cpm', 'banner', 'retargeting']
export const EMAIL_MEDIUMS = ['email', 'e-mail', 'newsletter', 'mail']

export type Channel = 'AI assistants' | 'Paid' | 'Email' | 'Social' | 'Search' | 'Referral' | 'Direct'
export const CHANNELS: Channel[] = ['AI assistants', 'Paid', 'Email', 'Social', 'Search', 'Referral', 'Direct']

const aiPatterns = AI_HOSTS.map(host)
const socialPatterns = SOCIAL_HOSTS.map(host)
const emailPatterns = EMAIL_HOSTS.map((h) => (h.endsWith('.') ? `^${h.replace(/\./g, '\\.')}` : host(h)))

const lit = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const arr = (xs: string[]) => `[${xs.map(lit).join(',')}]`

/** SQL expression (over `referrer` and `url`) yielding a channel name. Static, so safe to interpolate. */
export const CHANNEL_SQL = `multiIf(
  multiMatchAny(referrer, ${arr(aiPatterns)}) OR lower(extract(url, '[?&]utm_source=([^&]+)')) IN ${arr(AI_UTM_SOURCES).replace('[', '(').replace(/\]$/, ')')}, 'AI assistants',
  lower(extract(url, '[?&]utm_medium=([^&]+)')) IN ${arr(PAID_MEDIUMS).replace('[', '(').replace(/\]$/, ')')}, 'Paid',
  lower(extract(url, '[?&]utm_medium=([^&]+)')) IN ${arr(EMAIL_MEDIUMS).replace('[', '(').replace(/\]$/, ')')} OR multiMatchAny(referrer, ${arr(emailPatterns)}), 'Email',
  multiMatchAny(referrer, ${arr(socialPatterns)}), 'Social',
  multiMatchAny(referrer, ${arr(SEARCH_PATTERNS)}), 'Search',
  referrer != '', 'Referral',
  'Direct')`

function utm(url: string, key: string): string {
  const m = new RegExp(`[?&]${key}=([^&]+)`).exec(url)
  return m ? decodeURIComponent(m[1]).toLowerCase() : ''
}

/** TypeScript mirror of CHANNEL_SQL. */
export function classifyChannel(referrer: string, url = ''): Channel {
  const ref = referrer.toLowerCase()
  const src = utm(url, 'utm_source')
  const med = utm(url, 'utm_medium')
  const any = (ps: string[]) => ps.some((p) => new RegExp(p).test(ref))
  if (any(aiPatterns) || AI_UTM_SOURCES.includes(src)) return 'AI assistants'
  if (PAID_MEDIUMS.includes(med)) return 'Paid'
  if (EMAIL_MEDIUMS.includes(med) || any(emailPatterns)) return 'Email'
  if (any(socialPatterns)) return 'Social'
  if (any(SEARCH_PATTERNS)) return 'Search'
  if (ref !== '') return 'Referral'
  return 'Direct'
}

/** Readable acquisition source for revenue attribution: utm_source, else the referrer host, else "direct". */
export const SOURCE_SQL = `multiIf(
  extract(url, '[?&]utm_source=([^&]+)') != '', lower(extract(url, '[?&]utm_source=([^&]+)')),
  referrer != '', referrer,
  '(direct)')`
