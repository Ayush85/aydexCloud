import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from '@/lib/site'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['privacy-first analytics', 'cookieless analytics', 'Google Analytics alternative', 'GDPR analytics', 'website analytics', 'no cookie banner', 'self-hosted analytics'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url: '/', siteName: SITE_NAME, title: `${SITE_NAME} — ${SITE_TAGLINE}`, description: SITE_DESCRIPTION, locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: `${SITE_NAME} — ${SITE_TAGLINE}`, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
