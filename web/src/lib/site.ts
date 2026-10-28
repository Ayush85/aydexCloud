/** Canonical public origin, used for metadata, sitemap and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://aydex.cloud').replace(/\/+$/, '')
export const SITE_NAME = 'aydex.cloud'
export const SITE_TAGLINE = 'Privacy-first web analytics that explains why your traffic changed'
export const SITE_DESCRIPTION =
  'Cookieless web analytics with no consent banner by default. See bounce rate, time on page, funnels, revenue by source and AI-assistant traffic, and get plain-English explanations of why your traffic changed. No session recordings.'
