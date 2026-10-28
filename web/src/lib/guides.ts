// Long-form guides. Claims are limited to how aydex works and to well-documented behavior of
// other tools; legal topics say plainly that this is not legal advice.

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h2'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'code'; text: string }

export interface Guide {
  slug: string
  title: string
  description: string
  summary: string
  blocks: Block[]
  faqs: { q: string; a: string }[]
}

export const GUIDES: Guide[] = [
  {
    slug: "install-on-wordpress",
    title: "How to add aydex.cloud analytics to WordPress",
    description: "Add cookieless analytics to a WordPress site with the aydex.cloud plugin or a one-line snippet, and check that it works.",
    summary: "Two ways to install aydex.cloud on WordPress: the small plugin, or a header snippet.",
    blocks: [
      {
            "t": "p",
            "text": "aydex.cloud needs one script tag on every page. On WordPress you can add it with the aydex.cloud plugin, or paste the tag into your theme header with a snippet plugin."
      },
      {
            "t": "h2",
            "text": "Option 1: the aydex.cloud plugin"
      },
      {
            "t": "ol",
            "items": [
                  "Download the aydex-cloud folder from the packages/wordpress directory of the aydex repository and zip it.",
                  "In WordPress go to Plugins, Add New, Upload Plugin, and activate it.",
                  "Open Settings, aydex.cloud and paste your tracking ID from the dashboard.",
                  "Leave “do not count administrators” ticked so your own visits do not skew numbers."
            ]
      },
      {
            "t": "p",
            "text": "The plugin has only been syntax-checked, not run inside every WordPress version, so check the verification step below."
      },
      {
            "t": "h2",
            "text": "Option 2: paste the snippet"
      },
      {
            "t": "p",
            "text": "With a header-injection plugin such as WPCode, add this to the site-wide header:"
      },
      {
            "t": "code",
            "text": "<script defer data-site=\"YOUR_TRACKING_ID\" src=\"https://t.aydex.cloud/script.js\"></script>"
      },
      {
            "t": "h2",
            "text": "Check that it works"
      },
      {
            "t": "p",
            "text": "Open your site in a private window, then look at the Live view in your aydex dashboard. A visit should appear within a few seconds. If it does not, a caching or security plugin may be stripping the tag, or an ad blocker is blocking the request in your own browser."
      }
],
    faqs: [
      {
            "q": "Do I need a cookie banner for aydex on WordPress?",
            "a": "aydex does not set cookies or store anything on the visitor’s device by default. Whether you need a banner depends on your other plugins and on your local law, which this guide cannot decide for you."
      }
],
  },
  {
    slug: "install-on-nextjs",
    title: "How to add aydex.cloud analytics to a Next.js app",
    description: "Add cookieless analytics to a Next.js App Router project with next/script. Single-page navigations are tracked automatically.",
    summary: "One component in your root layout is all a Next.js app needs.",
    blocks: [
      {
            "t": "p",
            "text": "The aydex script tracks client-side navigations by itself, so no router hooks are needed. Load it with next/script in the root layout."
      },
      {
            "t": "code",
            "text": "import Script from 'next/script'\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang=\"en\">\n      <body>\n        {children}\n        <Script src=\"https://t.aydex.cloud/script.js\" data-site=\"YOUR_TRACKING_ID\" strategy=\"afterInteractive\" />\n      </body>\n    </html>\n  )\n}"
      },
      {
            "t": "h2",
            "text": "Custom events"
      },
      {
            "t": "p",
            "text": "After the script loads, call window.aydex.track('signup') anywhere in client code. Event names starting with an underscore are reserved."
      },
      {
            "t": "h2",
            "text": "Avoid ad blockers"
      },
      {
            "t": "p",
            "text": "Some blockers filter third-party analytics domains. You can proxy the script and collector through your own domain using Next.js rewrites; see the first-party proxy recipes in the aydex README."
      }
],
    faqs: [
      {
            "q": "Does it work with the Pages Router?",
            "a": "Yes. Put the same Script component in pages/_app.tsx."
      }
],
  },
  {
    slug: "install-on-shopify",
    title: "How to add aydex.cloud analytics to Shopify",
    description: "Add cookieless analytics to a Shopify store by pasting one script tag into theme.liquid.",
    summary: "Paste one line into your theme to start tracking a Shopify store.",
    blocks: [
      {
            "t": "ol",
            "items": [
                  "In the Shopify admin go to Online Store, Themes, then Edit code on your live theme.",
                  "Open layout/theme.liquid.",
                  "Paste this line just before the closing head tag, replacing YOUR_TRACKING_ID with the ID from your aydex dashboard.",
                  "Save, then visit your storefront and watch the Live view in aydex."
            ]
      },
      {
            "t": "code",
            "text": "<script defer data-site=\"YOUR_TRACKING_ID\" src=\"https://t.aydex.cloud/script.js\"></script>"
      },
      {
            "t": "p",
            "text": "This tracks storefront pages. Checkout pages on Shopify are controlled by Shopify and may not run custom scripts on every plan, so conversions at checkout may not be visible. Keep a copy of the line, because switching themes means pasting it again."
      }
],
    faqs: [
      {
            "q": "Can I track purchases?",
            "a": "Not automatically. Checkout pages are restricted on many plans. If your theme has a thank-you page you can edit, call window.aydex.track('purchase', { value: 49 }) there."
      }
],
  },
  {
    slug: "install-with-google-tag-manager",
    title: "How to add aydex.cloud analytics with Google Tag Manager",
    description: "Install aydex.cloud through a Google Tag Manager custom HTML tag, and the caveats to know about.",
    summary: "Use a Custom HTML tag in GTM to load aydex on every page.",
    blocks: [
      {
            "t": "ol",
            "items": [
                  "In Tag Manager create a new tag of type Custom HTML.",
                  "Paste the snippet below, with your tracking ID.",
                  "Set the trigger to All Pages (or Initialization - All Pages).",
                  "Preview, then publish the container."
            ]
      },
      {
            "t": "code",
            "text": "<script defer data-site=\"YOUR_TRACKING_ID\" src=\"https://t.aydex.cloud/script.js\"></script>"
      },
      {
            "t": "p",
            "text": "Prefer installing the script directly in your site where you can. Tag Manager is itself blocked by many privacy tools, so visitors using them will not be counted, and the tag adds a loading step before analytics starts."
      }
],
    faqs: [
      {
            "q": "Why are my numbers lower through GTM?",
            "a": "Visitors whose browsers block Tag Manager never load the aydex tag. Installing the script directly in your pages avoids that."
      }
],
  },
  {
    slug: 'track-chatgpt-perplexity-traffic',
    title: 'How to see traffic from ChatGPT, Perplexity and Claude in your analytics',
    description:
      'AI assistants now send real visitors. Learn how their traffic shows up in analytics, why some of it looks like direct traffic, and how to track it in aydex.cloud and in GA4.',
    summary: 'AI assistants send visitors who click citations and links. Here is how to find them, what you will miss, and how to measure it.',
    blocks: [
      { t: 'p', text: 'When ChatGPT, Perplexity, Claude, Gemini or Copilot cite your site, some people click through. Most analytics tools lump those visits into generic referral or direct traffic, so you cannot tell whether AI search is working for you.' },
      { t: 'h2', text: 'How AI visits show up' },
      { t: 'ul', items: [
        'As a referrer: the visitor’s browser reports the assistant’s domain, such as chatgpt.com, perplexity.ai, claude.ai, gemini.google.com or copilot.microsoft.com.',
        'As a tagged link: ChatGPT is known to add utm_source=chatgpt.com to links it opens, which analytics can read from the URL.',
        'As direct traffic: when an app, a mobile client or a privacy setting strips the referrer, the visit has no source and looks like direct traffic.',
      ] },
      { t: 'p', text: 'Because of that last case, any AI traffic number is a floor, not a total. Treat it as a trend line and compare it month to month rather than trusting the absolute figure.' },
      { t: 'h2', text: 'In aydex.cloud' },
      { t: 'p', text: 'aydex classifies these visits automatically as their own channel called “AI assistants”, matching both the referrer domain and the utm_source tag. You will see it in the Traffic channels chart and in a “From AI assistants” list that breaks the traffic down by assistant. The weekly email and the “why your traffic changed” panel also call out AI traffic when it moves.' },
      { t: 'h2', text: 'In Google Analytics 4' },
      { t: 'p', text: 'GA4 has no AI channel by default. You can approximate one with a custom channel group whose rule matches the session source against a regular expression:' },
      { t: 'code', text: 'chatgpt\\.com|openai\\.com|perplexity\\.ai|claude\\.ai|gemini\\.google\\.com|copilot\\.microsoft\\.com' },
      { t: 'p', text: 'Place that rule above the default Organic Search and Referral rules, otherwise gemini.google.com is counted as Google search.' },
      { t: 'h2', text: 'What to do with the numbers' },
      { t: 'ol', items: [
        'Find which pages AI assistants send people to, and strengthen those pages first.',
        'Compare engagement (bounce rate, time on page) for AI visitors with other channels.',
        'Check the content AI assistants cite: clear definitions, facts, pricing tables and dated updates are easier to quote.',
        'Track the trend weekly. A rising AI share usually means your content is being cited more.',
      ] },
    ],
    faqs: [
      { q: 'Why is my AI traffic so low?', a: 'Many AI visits arrive without a referrer and are counted as direct traffic, and many answers satisfy the user without a click. Use the figure as a trend, not a total.' },
      { q: 'Does aydex track which AI assistant sent the visit?', a: 'Yes, when the visit carries the assistant’s referrer domain or a utm_source tag. Visits without either appear as direct.' },
    ],
  },
  {
    slug: 'rage-clicks-without-session-recordings',
    title: 'Rage clicks and dead clicks without session recordings',
    description:
      'Find frustrated users and broken UI without recording anyone’s screen. How rage clicks, dead clicks and JavaScript errors are detected, what they tell you, and where the method has limits.',
    summary: 'You can spot UX problems from counts alone. No screenshots, no text, no replays.',
    blocks: [
      { t: 'p', text: 'Session recordings show exactly what a visitor did, which is also why they raise privacy concerns: screens can contain personal data. Frustration signals give you most of the “where is it broken?” value without capturing anything visual.' },
      { t: 'h2', text: 'The signals' },
      { t: 'ul', items: [
        'Rage click: three or more clicks within one second inside a small area, usually on something that is not responding.',
        'Dead click: a click on something that looks interactive, such as a button or a placeholder link, where nothing on the page changes within a short time.',
        'JavaScript error: an uncaught error or rejected promise on the page, which often explains rage clicks.',
        'Outbound and download clicks: where people leave, and which files they want.',
      ] },
      { t: 'h2', text: 'What aydex collects' },
      { t: 'p', text: 'aydex detects these in the browser and sends only a count, the page path and a CSS selector (for example button#buy), or for errors a scrubbed message with emails, long numbers and query strings removed. It never captures screenshots, page text, keystrokes or form input. The Behavior tab ranks pages and elements so you know where to look.' },
      { t: 'h2', text: 'How to act on them' },
      { t: 'ol', items: [
        'Open the Behavior tab and sort by the page with the most rage clicks.',
        'Reproduce the problem on that element: slow response, missing loading state, or a click target that is too small.',
        'Cross-check with JavaScript errors on the same page.',
        'Fix it, then watch the count fall over the next week.',
      ] },
      { t: 'h2', text: 'Limits to know' },
      { t: 'ul', items: [
        'Dead-click detection is a heuristic. Elements that act without changing the page, such as copy buttons, can be flagged. Use data-aydex-ignore on those elements.',
        'You see where and how often, not the full story of a single session. For that you would still need a replay tool.',
        'Counts are capped per page view to avoid noise from a single frustrated visitor.',
      ] },
    ],
    faqs: [
      { q: 'Does this record what users type?', a: 'No. aydex does not listen to keystrokes or form input and does not read page text.' },
      { q: 'Can I turn it off?', a: 'Yes. Add data-behavior="off" to the script tag, or data-aydex-ignore to individual elements.' },
    ],
  },
  {
    slug: 'cookieless-analytics-gdpr',
    title: 'Cookieless analytics and GDPR: what you need to know',
    description:
      'What cookieless analytics changes for consent banners, what it does not change, and the questions to ask before dropping a banner. A plain-language overview, not legal advice.',
    summary: 'Cookieless tracking removes one legal trigger but not every obligation. Here is the difference.',
    blocks: [
      { t: 'p', text: 'This guide is general information, not legal advice. Rules differ by country and by regulator, so confirm your own setup with a qualified adviser.' },
      { t: 'h2', text: 'Two different rules' },
      { t: 'ul', items: [
        'ePrivacy rules (the “cookie law”) concern storing or reading information on a visitor’s device. Cookies and similar storage generally need consent unless an exemption applies.',
        'GDPR concerns processing personal data. It applies whenever data can identify a person, even if no cookie is involved.',
      ] },
      { t: 'h2', text: 'What cookieless changes' },
      { t: 'p', text: 'A tool that never stores or reads anything on the visitor’s device does not trigger the ePrivacy device-access rule for that purpose. That is why many privacy-first analytics tools, including aydex.cloud in its default mode, do not need a consent banner for analytics in many setups.' },
      { t: 'h2', text: 'What it does not change' },
      { t: 'ul', items: [
        'You still process some data, such as a visitor identifier derived from request information, so you need a lawful basis and to describe it in your privacy notice.',
        'Some regulators set conditions for exempting analytics from consent, for example limits on retention and on combining data with other sources.',
        'If you add other tools (ads, heatmaps, session replay), those have their own rules.',
      ] },
      { t: 'h2', text: 'What aydex does by default' },
      { t: 'ul', items: [
        'Stores nothing on the visitor’s device. Persistent recognition is opt-in.',
        'Derives a visitor hash from site, day, IP and user agent that changes every day, and does not store the IP address in the analytics database.',
        'Keeps only the referrer’s host name, not the full URL.',
        'Deletes events automatically after two years.',
        'Lets you verify the served script on the privacy proof page.',
      ] },
      { t: 'h2', text: 'Questions to ask before removing a banner' },
      { t: 'ol', items: [
        'Does any other script on the site store or read device data?',
        'Is your visitor identifier ever combined with other data to identify a person?',
        'Does your regulator publish conditions for analytics exemptions, and do you meet them?',
        'Is your privacy notice accurate about what you collect?',
      ] },
    ],
    faqs: [
      { q: 'Can I remove my cookie banner after switching?', a: 'Only if nothing else on your site needs consent. Cookieless analytics removes the analytics reason for a banner, not the reasons that other tools may add. Check with a qualified adviser.' },
      { q: 'Is cookieless the same as anonymous?', a: 'No. Cookieless means nothing is stored on the device. Whether data is anonymous depends on what is collected and how it can be linked.' },
    ],
  },
  {
    slug: 'migrate-from-google-analytics',
    title: 'Migrating from Google Analytics 4 to a cookieless alternative',
    description:
      'A step-by-step migration plan from GA4: run both tools in parallel, import history, map your goals, and know what you will lose. Includes the GA4 data-retention facts that make exporting worthwhile.',
    summary: 'Run both for a week, import your history, recreate your goals, then switch off GA4 with confidence.',
    blocks: [
      { t: 'h2', text: 'Why export before you leave' },
      { t: 'p', text: 'GA4 keeps detailed user-level and event-level data for two months by default, and up to 14 months on standard properties. Standard reports keep aggregates, but if you want a long-term history in another tool, export it while you still can.' },
      { t: 'h2', text: 'The plan' },
      { t: 'ol', items: [
        'Add the aydex snippet next to GA4. Do not remove anything yet.',
        'In GA4, open a report with a Date or Day dimension, then use Share, Download file, CSV.',
        'In aydex open Share, API & Import and upload the CSV. Imported days only fill dates before your first aydex pageview, so nothing is double counted.',
        'Recreate your goals and funnels in aydex (page visits and custom events).',
        'Run both for at least a week and compare trends. Expect different totals: tools filter bots and define sessions differently.',
        'Remove the GA4 tag and, if nothing else needs it, your cookie banner.',
      ] },
      { t: 'h2', text: 'What you will lose' },
      { t: 'ul', items: [
        'Native Google Ads audiences, conversion import and remarketing.',
        'BigQuery raw event export.',
        'Predictive audiences and cross-device journeys.',
      ] },
      { t: 'p', text: 'If you rely on those, keep GA4 for advertising and use aydex for everyday reporting.' },
      { t: 'h2', text: 'What you gain' },
      { t: 'ul', items: [
        'No cookies by default and no analytics consent banner in many setups.',
        'Plain-English explanations of why traffic changed.',
        'Behavior signals without recordings, AI-assistant traffic and revenue by source.',
        'A REST API and MCP server on every plan.',
      ] },
    ],
    faqs: [
      { q: 'Will my numbers match GA4?', a: 'Not exactly. Expect the same trends but different totals, because tools differ in bot filtering and session definitions.' },
      { q: 'How far back can I import?', a: 'As far back as your GA4 export goes. aydex accepts up to 5,000 days in one file.' },
    ],
  },
]

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug)
