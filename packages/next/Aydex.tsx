import Script from 'next/script'

/**
 * Drop <Aydex siteId="YOUR_TRACKING_ID" /> into app/layout.tsx (inside <body>).
 * Loads the cookieless aydex.cloud script after the page is interactive.
 * Single-page navigations are tracked by the script itself; no router hooks needed.
 */
export function Aydex({
  siteId,
  src = 'https://t.aydex.cloud/script.js',
}: {
  siteId: string
  src?: string
}) {
  if (!siteId) return null
  return <Script src={src} data-site={siteId} strategy="afterInteractive" />
}
