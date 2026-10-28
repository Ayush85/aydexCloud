// Content for /vs/* pages. Competitor facts are limited to things stated in their own
// documentation (links in `sources`); everything else is about aydex. Keep it factual:
// each page also says where the competitor is the better choice.

export interface Comparison {
  slug: string
  name: string
  title: string
  description: string
  intro: string
  rows: { feature: string; aydex: string; them: string }[]
  themWins: string[]
  aydexWins: string[]
  switching: string[]
  faqs: { q: string; a: string }[]
  sources: { label: string; url: string }[]
}

export const COMPARISONS: Comparison[] = [
  {
    slug: 'google-analytics',
    name: 'Google Analytics',
    title: 'aydex.cloud vs Google Analytics (GA4): a privacy-first alternative',
    description:
      'Compare aydex.cloud and Google Analytics 4: cookies and consent, data retention, behavior insights, setup effort, and when GA4 is still the better choice. Includes GA4 history import.',
    intro:
      'Google Analytics 4 is free and deeply integrated with Google’s advertising tools. aydex.cloud is built for teams who want straight answers without cookies, consent banners or a steep learning curve. Here is an honest side-by-side.',
    rows: [
      { feature: 'Cookies / device storage', aydex: 'None by default. Optional encrypted visitor ID only if you enable it.', them: 'Uses first-party cookies by default.' },
      { feature: 'Consent banner (EU/UK)', aydex: 'The default mode stores nothing on the visitor’s device, which typically removes the need for a banner. Confirm with your own legal advice.', them: 'Generally set up behind a consent banner in these regions.' },
      { feature: 'Detailed (user/event-level) data retention', aydex: 'Two years, then automatically deleted.', them: 'Two months by default, up to 14 months on standard properties, for Explorations. Standard reports keep aggregates.' },
      { feature: 'Answers “why did traffic change?”', aydex: 'Built in: dashboard, weekly email, API and MCP, with every statement computed from your numbers.', them: 'Insights exist, but you assemble the explanation yourself in reports and Explorations.' },
      { feature: 'Frustration signals (rage clicks, dead clicks, JS errors)', aydex: 'Counted in the browser and sent as a count plus a CSS selector. No recordings.', them: 'Not part of standard GA4 reporting.' },
      { feature: 'Revenue by source', aydex: 'One line: aydex.track("purchase", { revenue: 49 }).', them: 'Ecommerce events and attribution models; more powerful, more setup.' },
      { feature: 'Public API', aydex: 'Included on every plan, plus an MCP server for AI assistants.', them: 'Data API and BigQuery export.' },
      { feature: 'Script weight', aydex: 'About 10 KB (4 KB gzipped), unminified and readable.', them: 'Loads Google’s tag library; measure it with your own tools.' },
      { feature: 'Price', aydex: 'Free plan up to 10,000 pageviews/month; paid plans from $7.', them: 'Free.' },
    ],
    themWins: [
      'You run Google Ads and want native audiences, conversion import and remarketing.',
      'You need raw event export to BigQuery for custom modelling.',
      'You need very high traffic volume at zero software cost.',
      'You rely on predictive audiences or cross-device user journeys.',
    ],
    aydexWins: [
      'You want accurate, simple numbers without cookie consent friction.',
      'You want someone, or something, to explain traffic changes in plain English.',
      'You care about frustration signals without session recording.',
      'You want API access on every plan and an MCP server for AI assistants.',
    ],
    switching: [
      'Add the aydex snippet next to GA4 and run both for a week to compare.',
      'Export a daily CSV from GA4 (Reports, Share, Download file, CSV) and import it under Share, API & Import to keep your trend lines.',
      'Imported days only fill dates before your first aydex pageview, so nothing is double counted.',
      'Remove GA4 when you are happy. Cookie banner optional afterwards.',
    ],
    faqs: [
      { q: 'Can I import my Google Analytics history?', a: 'Yes. Upload a GA4 daily CSV export (a report with a Date or Day dimension) in the dashboard. aydex stores daily totals and uses them only for dates before your first aydex pageview.' },
      { q: 'Will my numbers match GA4 exactly?', a: 'No, and no two tools do. aydex filters bots and referrer spam at collection time, does not depend on cookies, and defines a session as one visitor on one UTC day. Expect the same trends, not identical totals.' },
      { q: 'Do I still need a cookie banner?', a: 'In its default mode aydex stores nothing on the visitor’s device, which typically avoids the need for a banner for analytics. This is not legal advice; check the rules that apply to you.' },
      { q: 'Is aydex a full replacement for GA4?', a: 'For traffic, engagement, funnels, goals, campaigns and revenue by source, yes. If you depend on Google Ads audiences or BigQuery export, keep GA4 for that.' },
    ],
    sources: [
      { label: 'GA4 data retention explained (Usercentrics)', url: 'https://usercentrics.com/knowledge/ga4-data-retention/' },
    ],
  },
  {
    slug: 'microsoft-clarity',
    name: 'Microsoft Clarity',
    title: 'aydex.cloud vs Microsoft Clarity: analytics without session recordings',
    description:
      'Compare aydex.cloud and Microsoft Clarity: session recordings vs privacy-first behavior signals, consent requirements in the EU/UK, funnels, revenue and API. See when Clarity is the better pick.',
    intro:
      'Microsoft Clarity is a free tool centred on session recordings and heatmaps. aydex.cloud takes the opposite approach: it surfaces the same frustration signals, such as rage clicks, dead clicks and JavaScript errors, as counts, never recordings, inside a full analytics dashboard.',
    rows: [
      { feature: 'Session recordings', aydex: 'No, by design. Nothing visual or textual is captured.', them: 'Yes, session recordings are the core feature.' },
      { feature: 'Heatmaps', aydex: 'A weekday-by-hour traffic heatmap. No click or scroll heatmaps.', them: 'Click and scroll heatmaps.' },
      { feature: 'Rage clicks, dead clicks, JS errors', aydex: 'Yes, as counts with the element selector or a scrubbed message.', them: 'Yes, with recordings attached to each.' },
      { feature: 'Consent in EEA / UK / Switzerland', aydex: 'The default mode stores nothing on the device, which typically removes the need for a banner. Confirm with your own legal advice.', them: 'Microsoft states a valid consent signal is required for full functionality in these regions (enforced from 31 October 2025). Without it only cookieless data is collected and some features may not work.' },
      { feature: 'Funnels and goals', aydex: 'Funnels, goals, campaigns and UTM reports.', them: 'Funnels and goals available.' },
      { feature: 'Revenue by source', aydex: 'Built in via one tracking call.', them: 'Not its focus.' },
      { feature: 'Explains traffic changes', aydex: 'Yes: dashboard, email, API and MCP.', them: 'No.' },
      { feature: 'Public API', aydex: 'Included on every plan.', them: 'Data export API available.' },
      { feature: 'Price', aydex: 'Free plan up to 10,000 pageviews/month; paid plans from $7.', them: 'Free.' },
    ],
    themWins: [
      'You need to watch real sessions to understand a confusing flow.',
      'You want click and scroll heatmaps on specific pages.',
      'Your team already uses Microsoft Ads and Clarity together.',
    ],
    aydexWins: [
      'You want behavior signals without recording anyone’s screen.',
      'You want traffic, funnels, revenue and insights in one product.',
      'You want to keep consent friction out of your analytics.',
      'You want programmatic access and an MCP server on every plan.',
    ],
    switching: [
      'Add the aydex snippet. Rage clicks, dead clicks and JS errors start appearing in the Behavior tab.',
      'Keep Clarity on only the pages where you genuinely need recordings.',
      'Use data-aydex-ignore on any element whose clicks you want excluded.',
    ],
    faqs: [
      { q: 'Does aydex record sessions?', a: 'No. aydex never records the screen, text, keystrokes or form input. It counts events such as rage clicks and sends only the count and a CSS selector or scrubbed error message.' },
      { q: 'How can I find a UX problem without recordings?', a: 'The Behavior tab ranks pages and elements by rage clicks and dead clicks and lists JavaScript errors, so you know where to look. For a visual replay you would still need a recording tool.' },
      { q: 'Can I use aydex and Clarity together?', a: 'Yes. Many teams use aydex for analytics and a recording tool on a few key pages.' },
    ],
    sources: [
      { label: 'Clarity consent management (Microsoft Learn)', url: 'https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-management' },
    ],
  },
  {
    slug: 'plausible',
    name: 'Plausible',
    title: 'aydex.cloud vs Plausible Analytics: a cookieless alternative with insights',
    description:
      'Compare aydex.cloud and Plausible Analytics: cookies, hosting, self-hosting, behavior signals, AI-assistant traffic, revenue attribution and API. See where Plausible is the better fit.',
    intro:
      'Plausible is a well-known, cookieless, open-source analytics tool hosted in the EU. aydex.cloud shares the privacy-first approach and adds explanations of why traffic changed, behavior signals without recordings, AI-assistant traffic and an MCP server.',
    rows: [
      { feature: 'Cookies', aydex: 'None by default; an optional encrypted visitor ID if you enable it.', them: 'Plausible states it uses no cookies or other persistent identifiers.' },
      { feature: 'Open source / self-hosting', aydex: 'Self-hostable with Docker Compose (Next.js, Go collector, ClickHouse, Postgres, Redis).', them: 'Open source with the code on GitHub, and can be self-hosted.' },
      { feature: 'Data location', aydex: 'Wherever you host it. The hosted service runs on our own server.', them: 'Servers in Falkenstein, Germany (Hetzner); company incorporated in Estonia.' },
      { feature: 'Explains why traffic changed', aydex: 'Yes: dashboard, weekly email, API and MCP, computed from your numbers.', them: 'Not covered on the pages we reviewed.' },
      { feature: 'Frustration signals (rage clicks, dead clicks, JS errors)', aydex: 'Yes, as counts with a selector or scrubbed message. No recordings.', them: 'Not covered on the pages we reviewed.' },
      { feature: 'AI-assistant traffic as its own channel', aydex: 'Yes: ChatGPT, Perplexity, Claude, Gemini, Copilot and others.', them: 'Not covered on the pages we reviewed.' },
      { feature: 'Revenue by source', aydex: 'One line: aydex.track("purchase", { revenue: 49 }).', them: 'Not covered on the pages we reviewed.' },
      { feature: 'Import from Google Analytics', aydex: 'GA4 daily CSV import.', them: 'Check their documentation.' },
      { feature: 'Price', aydex: 'Free plan up to 10,000 pageviews/month; paid plans from $7.', them: 'See their pricing page.' },
    ],
    themWins: [
      'You want the simplest possible dashboard from a mature, widely used product.',
      'EU hosting under an EU-incorporated company matters for your compliance story.',
      'You prefer a long-established open-source community around the tool.',
    ],
    aydexWins: [
      'You want the dashboard to tell you why traffic changed, not just chart it.',
      'You want rage clicks, dead clicks and JS errors without recording sessions.',
      'You want to see how much traffic AI assistants send you.',
      'You want a REST API and MCP server for AI assistants on every plan.',
    ],
    switching: [
      'Add the aydex snippet beside Plausible and compare for a week.',
      'Import GA4 history if you have it, so trends carry over.',
      'Plausible is cookieless too, so removing it needs no change to your consent setup.',
    ],
    faqs: [
      { q: 'Is aydex.cloud cookieless like Plausible?', a: 'Yes. By default the aydex script stores nothing on the visitor’s device. You can verify the served script on the privacy proof page.' },
      { q: 'Can I self-host aydex.cloud?', a: 'Yes, with Docker Compose. You run the web app, the Go collector, ClickHouse, Postgres and Redis yourself.' },
      { q: 'Which is simpler?', a: 'Plausible is deliberately minimal. aydex has more reports (funnels, behavior, revenue, insights), so its dashboard has more tabs.' },
    ],
    sources: [
      { label: 'Plausible: privacy-focused web analytics', url: 'https://ingest.plausible.io/privacy-focused-web-analytics' },
    ],
  },
  {
    slug: 'fathom',
    name: 'Fathom Analytics',
    title: 'aydex.cloud vs Fathom Analytics: privacy-first analytics compared',
    description:
      'Compare aydex.cloud and Fathom Analytics: cookies, visitor counting, EU data handling, self-hosting, behavior signals, AI traffic, revenue and API. See where Fathom is the stronger choice.',
    intro:
      'Fathom is a long-running privacy-focused analytics service with an EU data isolation feature. aydex.cloud takes a similar cookieless approach and adds traffic explanations, behavior signals without recordings, AI-assistant traffic and an MCP server, and it can be self-hosted.',
    rows: [
      { feature: 'Cookies', aydex: 'None by default; optional encrypted visitor ID.', them: 'Fathom describes itself as having no cookies, so no consent banner for analytics.' },
      { feature: 'Visitor counting', aydex: 'Daily-rotating hash of site, day, IP and user agent.', them: 'Site-specific signatures from request data, with daily salt rotation.' },
      { feature: 'EU data handling', aydex: 'Your choice of region if you self-host.', them: 'A dedicated EU data isolation feature.' },
      { feature: 'Self-hosting', aydex: 'Yes, with Docker Compose.', them: 'Not mentioned on the pages we reviewed.' },
      { feature: 'Explains why traffic changed', aydex: 'Yes: dashboard, weekly email, API and MCP.', them: 'Not covered on the pages we reviewed.' },
      { feature: 'Frustration signals (rage/dead clicks, JS errors)', aydex: 'Yes, as counts. No recordings.', them: 'Not covered on the pages we reviewed.' },
      { feature: 'AI-assistant traffic as its own channel', aydex: 'Yes.', them: 'Not covered on the pages we reviewed.' },
      { feature: 'API and email reports', aydex: 'REST API and MCP on every plan; weekly email digest.', them: 'API and email reports are listed among its features.' },
      { feature: 'Price', aydex: 'Free plan up to 10,000 pageviews/month; paid plans from $7.', them: 'See their pricing page (they list a free trial).' },
    ],
    themWins: [
      'You want a mature hosted product with a dedicated EU isolation feature.',
      'You want a vendor with a long track record and a data processing agreement ready.',
      'You do not want to think about self-hosting at all.',
    ],
    aydexWins: [
      'You want the option to self-host and keep data on your own infrastructure.',
      'You want explanations of traffic changes and behavior signals without recordings.',
      'You want to measure AI-assistant traffic and query it through an API or MCP.',
    ],
    switching: [
      'Run the aydex snippet next to Fathom for a week.',
      'Import GA4 history if you have it to extend your trend lines.',
      'Both are cookieless, so your consent setup does not change.',
    ],
    faqs: [
      { q: 'Does aydex have an EU data isolation feature?', a: 'aydex does not offer a separate isolation feature. If EU-only storage matters, self-host it in an EU region or choose a vendor that provides that isolation.' },
      { q: 'Is aydex cookieless like Fathom?', a: 'Yes. By default the script stores nothing on the visitor’s device; verify it on the privacy proof page.' },
      { q: 'Can I migrate from Fathom?', a: 'Install the aydex snippet and run both in parallel. aydex imports Google Analytics CSVs; it does not import Fathom exports.' },
    ],
    sources: [
      { label: 'Fathom: GDPR-compliant analytics', url: 'https://usefathom.com/why-fathom-analytics/gdpr-compliant-analytics' },
    ],
  },
  {
    slug: 'umami',
    name: 'Umami',
    title: 'aydex.cloud vs Umami: self-hostable analytics compared',
    description:
      'Compare aydex.cloud and Umami: open source, self-hosting stack, cookies, behavior signals, AI-assistant traffic, revenue attribution and API. See where Umami is the better pick.',
    intro:
      'Umami is a popular open-source, self-hostable analytics tool. aydex.cloud is also self-hostable and privacy-first, and focuses on explaining traffic changes, behavior signals without recordings, AI-assistant traffic and revenue by source.',
    rows: [
      { feature: 'Open source / self-hosting', aydex: 'Self-hostable with Docker Compose (Next.js, Go collector, ClickHouse, Postgres, Redis).', them: 'Open source and self-hostable per its documentation; a hosted cloud version also exists.' },
      { feature: 'Cookies', aydex: 'None by default.', them: 'Marketed as cookieless; confirm in its documentation for your setup.' },
      { feature: 'Self-hosting footprint', aydex: 'Heavier: ClickHouse and Redis alongside Postgres.', them: 'Lighter to operate for small sites.' },
      { feature: 'Explains why traffic changed', aydex: 'Yes: dashboard, weekly email, API and MCP.', them: 'Not covered on the pages we reviewed.' },
      { feature: 'Frustration signals (rage/dead clicks, JS errors)', aydex: 'Yes, as counts. No recordings.', them: 'Not covered on the pages we reviewed.' },
      { feature: 'AI-assistant traffic as its own channel', aydex: 'Yes.', them: 'Not covered on the pages we reviewed.' },
      { feature: 'Revenue by source', aydex: 'One tracking call.', them: 'Check their documentation.' },
      { feature: 'Import from Google Analytics', aydex: 'GA4 daily CSV import.', them: 'Check their documentation.' },
      { feature: 'Price', aydex: 'Free plan up to 10,000 pageviews/month; paid plans from $7.', them: 'Free to self-host; see their site for cloud pricing.' },
    ],
    themWins: [
      'You want the lightest possible self-hosted setup.',
      'You want a large open-source community and a lot of third-party guides.',
      'You mainly need a simple dashboard for a few sites.',
    ],
    aydexWins: [
      'You want a managed service as well as the option to self-host.',
      'You want explanations of traffic changes and behavior signals without recordings.',
      'You want AI-assistant traffic, revenue by source and an MCP server built in.',
    ],
    switching: [
      'Install the aydex snippet next to Umami and compare for a week.',
      'Import GA4 history if you have it so trends continue.',
      'Both are privacy-first, so your consent setup stays the same.',
    ],
    faqs: [
      { q: 'Which is easier to self-host?', a: 'Umami has a lighter footprint. aydex needs ClickHouse and Redis as well as Postgres, which is what lets it answer heavier questions quickly at scale.' },
      { q: 'Can I use aydex without self-hosting?', a: 'Yes. aydex.cloud is a hosted service with a free plan, and you can self-host later if you want.' },
    ],
    sources: [
      { label: 'Umami documentation (third-party mirror)', url: 'https://www.mintlify.com/umami-software/umami' },
    ],
  },
]

export const bySlug = (slug: string) => COMPARISONS.find((c) => c.slug === slug)
