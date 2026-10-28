import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { COMPARISONS } from '@/lib/comparisons'
import { GUIDES } from '@/lib/guides'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/vs`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    ...GUIDES.map((g) => ({ url: `${SITE_URL}/guides/${g.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/llms.txt`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy-proof`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    ...COMPARISONS.map((c) => ({ url: `${SITE_URL}/vs/${c.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${SITE_URL}/auth/signup`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ]
}
