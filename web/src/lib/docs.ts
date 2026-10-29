// User guide. Every statement describes behaviour that exists in this codebase; plan numbers are
// generated from PLANS so they cannot drift from what is enforced.
import { PLANS } from './plans'
import type { Block } from './guides'

export type DocBlock = Block | { t: 'table'; head: string[]; rows: string[][] }

export interface DocPage {
  slug: string
  group: 'Start here' | 'Using the dashboard' | 'Tracking' | 'Automate' | 'Reference'
  title: string
  description: string
  blocks: DocBlock[]
}

const SNIPPET = '<script defer data-site="YOUR_TRACKING_ID" src="https://t.aydex.cloud/script.js"></script>'
const n = (v: number) => (Number.isFinite(v) ? v.toLocaleString('en-US') : 'Unlimited')

export const DOCS: DocPage[] = [
  {
    slug: 'getting-started', group: 'Start here', title: 'Getting started',
    description: 'Create an account, add your site, install the tracking script and see your first visit in about five minutes.',
    blocks: [
      { t: 'p', text: 'aydex.cloud measures your website traffic without cookies. You add one script tag to your pages and the dashboard fills in as people visit.' },
      { t: 'h2', text: '1. Create an account and add a site' },
      { t: 'ol', items: ['Sign up at aydex.cloud/auth/signup with an email and a password of 8 to 72 characters.', 'On the dashboard choose “Add website” and enter a name and your domain, for example example.com.', 'Open the site. The Share, API & Import tab shows your tracking ID and the snippet to copy.'] },
      { t: 'h2', text: '2. Install the script' },
      { t: 'p', text: 'Paste this into the head of every page, replacing YOUR_TRACKING_ID with the ID from your dashboard:' },
      { t: 'code', text: SNIPPET },
      { t: 'p', text: 'Using WordPress, Next.js, Shopify or Google Tag Manager? Follow the matching install guide under Guides.' },
      { t: 'h2', text: '3. Check that it works' },
      { t: 'ul', items: ['Use “Verify installation” in the Share, API & Import tab. It fetches your homepage and looks for the script tag with your tracking ID.', 'Open your site in a private window and watch the Live badge on the dashboard. A visit shows up within seconds.', 'If nothing appears, see Troubleshooting.'] },
      { t: 'p', text: 'Your own visits are counted unless a browser extension blocks the script. Add data-aydex-ignore to any element whose clicks you want excluded from behavior signals.' },
    ],
  },
  {
    slug: 'dashboard-tabs', group: 'Using the dashboard', title: 'The dashboard, tab by tab',
    description: 'What each tab of the aydex.cloud dashboard shows and how to read it.',
    blocks: [
      { t: 'p', text: 'Pick a period (Today, 7 days, 30 days or 90 days) at the top. Every tab follows it, and comparisons are always against the previous period of the same length.' },
      { t: 'table', head: ['Tab', 'What you get'], rows: [
        ['Overview', 'Pageviews, visitors, bounce rate and time on page; the traffic chart; “why your traffic changed” insights; top pages, referrers, countries, devices and browsers.'],
        ['Behavior', 'Rage clicks, dead clicks, JavaScript errors, outbound and download clicks, scroll depth, entry and exit pages, and a click heatmap.'],
        ['Funnels', 'Multi-step conversion paths you define; shows how many visitors reach each step.'],
        ['Revenue', 'Orders, buyers and revenue by traffic source, from purchase events that carry a revenue value.'],
        ['Campaigns & Events', 'UTM campaigns, and every custom event your site sends.'],
        ['Goals', 'Count a visit to a page or a custom event as a conversion.'],
        ['Alerts', 'Daily traffic drop, spike and no-data alerts by email, plus the Slack or Discord webhook.'],
        ['Custom Charts', 'Build your own chart from a metric, a dimension and an optional filter.'],
        ['Privacy & Data', 'What is and is not stored about visitors, and the site’s storage mode.'],
        ['Encryption', 'Generate the key snippet used with persistent, encrypted visitor ids.'],
        ['Share, API & Import', 'Tracking snippet, install check, public link, CSV export, API keys pointer, GA4 import and first-party proxy recipes.'],
      ] },
      { t: 'h2', text: 'Notes on the chart' },
      { t: 'p', text: 'Under the traffic chart, “Add note” marks a date, for example “Launched on Product Hunt”. Notes appear as dashed amber lines on the chart, so you can see why traffic moved. They are not drawn on the hourly “Today” view.' },
    ],
  },
  {
    slug: 'goals-and-events', group: 'Tracking', title: 'Goals and custom events',
    description: 'Send your own events with aydex.track and turn pageviews or events into goals.',
    blocks: [
      { t: 'h2', text: 'Custom events' },
      { t: 'p', text: 'Once the script has loaded, call aydex.track from your own code:' },
      { t: 'code', text: "aydex.track('signup')\naydex.track('add_to_cart', { sku: 'A-100', price: 29 })" },
      { t: 'ul', items: ['Event names are cut to 64 characters. Names that start with an underscore are reserved for aydex’s own signals and are ignored if you send them.', 'Properties are optional and are stored as JSON next to the event.', 'Events appear under Campaigns & Events and can be used in goals, funnels and custom charts.'] },
      { t: 'h2', text: 'Goals' },
      { t: 'ol', items: ['Open the Goals tab and add a goal.', 'Choose “pageview” to match an exact page path such as /thanks (the query string is ignored), or “event” to match an event name exactly.', 'The goal shows how many unique visitors completed it in the selected period, and the conversion rate.'] },
    ],
  },
  {
    slug: 'funnels', group: 'Tracking', title: 'Funnels',
    description: 'Define a multi-step path and see where visitors drop off.',
    blocks: [
      { t: 'p', text: 'A funnel is an ordered list of steps, each a page path or an event name. aydex counts the visitors who reached each step in order and shows the drop-off between steps.' },
      { t: 'ol', items: ['Open Funnels and create one with a name and between 2 and 8 steps. Each step is a page or an event.', 'Order matters: put the entry step first.', 'Read the drop-off percentage between neighbouring steps to find the weakest step.'] },
      { t: 'p', text: 'Because visitor ids are cookieless and rotate daily by default, a funnel measures a path completed within one day unless you turn on persistent visitor ids (see Privacy and definitions).' },
    ],
  },
  {
    slug: 'behavior-signals', group: 'Tracking', title: 'Behavior signals',
    description: 'Rage clicks, dead clicks, JavaScript errors, outbound links and downloads, counted without session recordings.',
    blocks: [
      { t: 'p', text: 'The script counts a few frustration signals and sends only a count plus a CSS selector or a scrubbed error message. It never sends text, keystrokes, screenshots or form values.' },
      { t: 'table', head: ['Signal', 'Meaning'], rows: [
        ['Rage click', 'Three or more clicks within one second inside a 30 pixel area.'],
        ['Dead click', 'A button-like element that changed nothing on the page for 800 ms. This is a heuristic, so expect some false positives.'],
        ['JavaScript error', 'An uncaught error or unhandled promise rejection. Email addresses, long numbers and query strings are scrubbed from the message.'],
        ['Outbound click', 'A click on a link to another site (origin and path only).'],
        ['Download', 'A click on a link to a file such as PDF, ZIP, DOCX or MP4 (file name only).'],
      ] },
      { t: 'p', text: 'To switch all of this off, add data-behavior="off" to the script tag. To exclude part of a page, add data-aydex-ignore to an element.' },
    ],
  },
  {
    slug: 'revenue', group: 'Tracking', title: 'Revenue by source',
    description: 'Attribute purchases to the traffic source that brought the buyer.',
    blocks: [
      { t: 'p', text: 'Send a purchase event with a revenue number and, optionally, a currency:' },
      { t: 'code', text: "aydex.track('purchase', { revenue: 49, currency: 'USD' })" },
      { t: 'ul', items: ['The Revenue tab groups orders, buyers and revenue by the source of the buyer’s first pageview that day.', 'Because visitor ids rotate daily by default, a purchase on a later day than the first visit is attributed to that day’s source, not the original one.', 'Totals are grouped per currency and never converted.'] },
      { t: 'p', text: 'aydex records the numbers your site sends. It does not connect to Stripe or other payment providers.' },
    ],
  },
  {
    slug: 'channels-and-ai-traffic', group: 'Using the dashboard', title: 'Traffic channels and AI assistants',
    description: 'How visits are grouped into channels, including visits from ChatGPT, Perplexity, Claude and Gemini.',
    blocks: [
      { t: 'p', text: 'Each visit is placed in one channel: AI assistants, Paid, Email, Social, Search, Referral or Direct (checked in that order, so a tagged paid click is Paid even if it came from a search engine). The Overview shows the split as a chart.' },
      { t: 'p', text: 'AI assistants are recognised from the referrer domain (such as chatgpt.com, perplexity.ai, claude.ai, gemini.google.com, copilot.microsoft.com) and from the utm_source tag some assistants add. Visits where an app or browser strips the referrer count as Direct, so the AI number is a floor, not a total. Use it as a trend.' },
    ],
  },
  {
    slug: 'insights', group: 'Using the dashboard', title: 'Why your traffic changed',
    description: 'How the insights panel explains changes, and what it can and cannot tell you.',
    blocks: [
      { t: 'p', text: 'The insights panel compares this period with the previous one and lists the biggest movers: a channel, referrer, page, country or device that accounts for much of the change, new and lost sources, and unusual days.' },
      { t: 'ul', items: ['It is rule-based. It reads your numbers and says what accounts for a change; it does not claim to know the cause.', 'Your chart notes that fall in the period are listed too.', 'The same insights are in the weekly email, the API (insights report) and the MCP server.'] },
    ],
  },
  {
    slug: 'alerts-and-webhooks', group: 'Automate', title: 'Alerts, Slack and Discord',
    description: 'Get a message when traffic drops, spikes or stops, and send summaries to a chat channel.',
    blocks: [
      { t: 'h2', text: 'Traffic alerts' },
      { t: 'p', text: `Each morning (UTC) aydex compares yesterday with the previous 14 days. You are emailed when yesterday was at most half the usual level, at least double it, or exactly zero (often a sign the script was removed). Sites averaging under about 20 pageviews a day are skipped because there is too little signal. Alerts are included on ${Object.values(PLANS).filter((p) => p.alerts).map((p) => p.label).join(' and ')}. Turn them on in the Alerts tab.` },
      { t: 'h2', text: 'Slack and Discord' },
      { t: 'ol', items: ['In Slack create an incoming webhook (Apps, Incoming Webhooks). In Discord open Channel settings, Integrations, Webhooks.', 'Paste the URL in the Alerts tab and choose “Send test”.', 'Alerts and the weekly summary are posted to the channel. Webhooks work on every plan.'] },
      { t: 'p', text: 'Only hooks.slack.com and discord.com webhook URLs are accepted. The URL is stored but never shown in full again.' },
      { t: 'h2', text: 'Weekly email' },
      { t: 'p', text: 'Sent every Monday at 09:00 UTC with totals and insights. Turn it on or off under Billing, “Weekly email digest”.' },
    ],
  },
  {
    slug: 'sharing-and-export', group: 'Using the dashboard', title: 'Sharing, export and import',
    description: 'Public dashboards, the visitor badge, CSV export and importing Google Analytics history.',
    blocks: [
      { t: 'h2', text: 'Public dashboard' },
      { t: 'p', text: 'Switch on the public link in Share, API & Import to show a read-only overview at a private URL. Switch it off at any time and the link stops working.' },
      { t: 'h2', text: 'Visitor badge' },
      { t: 'p', text: 'With the public link on, you can embed a small badge showing visitors over the last 7 days. It only works for public sites and reveals nothing else.' },
      { t: 'h2', text: 'CSV export' },
      { t: 'p', text: 'Download a CSV for today, 7 days or 30 days from the same tab.' },
      { t: 'h2', text: 'Import Google Analytics history' },
      { t: 'p', text: 'Upload a GA4 daily CSV. Imported days fill only dates before your first aydex pageview, so real aydex data is never overwritten. Imported visitors are daily totals added together and are not de-duplicated across days.' },
    ],
  },
  {
    slug: 'api', group: 'Automate', title: 'REST API',
    description: 'Read your analytics from your own code with an API key. Available on every plan.',
    blocks: [
      { t: 'p', text: 'Create a key under API keys (up to 25). The key is shown once; only a hash is stored.' },
      { t: 'code', text: 'curl -H "Authorization: Bearer ax_live_..." https://aydex.cloud/api/v1/sites\ncurl -H "Authorization: Bearer ax_live_..." "https://aydex.cloud/api/v1/sites/SITE_ID/insights?period=7d"' },
      { t: 'table', head: ['Item', 'Value'], rows: [
        ['Reports', 'overview, timeseries, pages, referrers, channels, ai-referrals, countries, devices, browsers, campaigns, events, engagement, entry-exit, behavior, revenue, insights, funnels, heatmap'],
        ['Periods', 'today, 7d, 30d, 90d (set with ?period=)'],
        ['Rate limit', '120 requests a minute per key; beyond that you receive HTTP 429'],
        ['Access', 'Read-only. A key sees only the sites of the account that created it'],
      ] },
    ],
  },
  {
    slug: 'mcp', group: 'Automate', title: 'Ask Claude about your analytics (MCP)',
    description: 'Connect the aydex MCP server to Claude or another MCP client and ask questions in plain language.',
    blocks: [
      { t: 'p', text: 'The MCP server is a small read-only program that calls the REST API with your key, so an assistant can answer questions such as “why did traffic drop last week?” from your real numbers.' },
      { t: 'ol', items: ['Create an API key.', 'Get the mcp folder from the aydex repository and run npm install in it.', 'Add it to your MCP client with AYDEX_API_KEY and AYDEX_URL set. The mcp/README.md has copy-paste configuration for Claude Desktop and Claude Code.'] },
      { t: 'table', head: ['Tool', 'Use'], rows: [
        ['list_sites', 'See which sites the key can read'],
        ['why_did_traffic_change', 'Explain the change against the previous period'],
        ['site_health_check', 'Totals, bounce, channels, frustration signals and errors in one call'],
        ['get_report', 'Fetch any of the API reports'],
      ] },
    ],
  },
  {
    slug: 'privacy-and-definitions', group: 'Reference', title: 'Privacy, storage and definitions',
    description: 'What aydex stores, the optional persistent visitor id, and exactly how each metric is defined.',
    blocks: [
      { t: 'h2', text: 'What is stored' },
      { t: 'p', text: 'By default the script sets no cookies and writes nothing to the visitor’s device. Visitors are counted with an anonymous id that rotates daily. You can check the exact script served to visitors on the Privacy Proof page.' },
      { t: 'h2', text: 'Optional settings on the script tag' },
      { t: 'table', head: ['Attribute', 'Effect'], rows: [
        ['data-storage="localStorage" or "sessionStorage"', 'Keeps a random visitor id on the device so visits link across days. Add data-key to encrypt it. This is opt-in, and whether it needs consent depends on your local law.'],
        ['data-respect-dnt="true"', 'Sends nothing when the browser’s Do Not Track signal is on.'],
        ['data-endpoint="e"', 'Sends data to a different path, for use behind a first-party proxy.'],
        ['data-behavior="off"', 'Turns off rage, dead click, error, outbound and download signals.'],
        ['data-spa="off"', 'Turns off automatic pageviews for single-page-app navigation.'],
      ] },
      { t: 'h2', text: 'Definitions' },
      { t: 'ul', items: [
        'Session: one visitor id on one UTC day. With the default rotating ids a session never spans midnight.',
        'Bounce rate: the share of sessions with a single pageview.',
        'Time on page: visible-tab time per page load, averaged over page loads that reported it.',
        'Dead click: a heuristic, not a certainty.',
        'Bots and referrer spam are filtered when the data is collected.',
      ] },
      { t: 'p', text: 'This page describes how the product works. It is not legal advice.' },
    ],
  },
  {
    slug: 'troubleshooting', group: 'Reference', title: 'Troubleshooting',
    description: 'No data, numbers that look low, and other common problems.',
    blocks: [
      { t: 'table', head: ['Problem', 'What to check'], rows: [
        ['Nothing appears', 'Run “Verify installation”. Confirm the tracking ID matches, the tag is on every page, and a caching or security plugin is not removing it.'],
        ['Your own visit is missing', 'An ad blocker or privacy extension may block the script in your browser. Test in a private window with extensions off, or serve the script from your own domain.'],
        ['Numbers lower than expected', 'Visitors with blockers are not counted, and bots are filtered. Counts differ from other tools by design.'],
        ['Traffic stops at a certain day', 'Your plan’s monthly pageview limit may have been reached. Events beyond it are dropped until the month resets or you upgrade.'],
        ['No alerts arrive', 'Alerts need Pro or Agency, the site needs about 20 pageviews a day, and you need an email on the account.'],
        ['Webhook rejected', 'Only Slack incoming-webhook and Discord webhook URLs are accepted.'],
      ] },
    ],
  },
  {
    slug: 'plans-and-limits', group: 'Reference', title: 'Plans and limits',
    description: 'Sites, monthly pageviews and included features for each plan.',
    blocks: [
      { t: 'table', head: ['Plan', 'Price', 'Sites', 'Pageviews / month', 'Alerts'], rows:
        Object.values(PLANS).map((p) => [p.label, p.price === 0 ? 'Free' : `$${p.price}/month`, n(p.maxSites), n(p.maxPageviews), p.alerts ? 'Yes' : 'No']) },
      { t: 'p', text: 'The pageview limit is counted per calendar month. Events beyond it are not recorded until the next month. The REST API, MCP server, funnels, goals, webhooks and exports are available on every plan.' },
    ],
  },
]

export const DOC_GROUPS: DocPage['group'][] = ['Start here', 'Using the dashboard', 'Tracking', 'Automate', 'Reference']
export const docBySlug = (s: string) => DOCS.find((d) => d.slug === s)
