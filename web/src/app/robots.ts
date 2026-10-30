import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Public pages are open to search engines and AI search/answer crawlers alike.
// Private areas stay blocked for everyone. Specific user-agent groups do not
// inherit from "*", so the disallow list is repeated for each.
const PRIVATE = ['/api/', '/dashboard', '/auth/', '/share/']

// Crawlers behind AI search, assistants and browsing. Names per each vendor's docs;
// delete a line to opt that crawler out.
const AI_CRAWLERS = [
  'OAI-SearchBot', 'ChatGPT-User', 'GPTBot',
  'PerplexityBot', 'Perplexity-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'Google-Extended', 'Applebot-Extended',
  'DuckAssistBot', 'Meta-ExternalAgent', 'Amazonbot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
