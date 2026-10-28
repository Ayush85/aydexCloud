// Shown on the landing page and mirrored into FAQPage structured data (the two must match).
export const FAQS = [
  { q: 'Is aydex.cloud really cookieless?', a: 'Yes. By default the tracking script stores nothing on the visitor’s device. Unique visitors are counted with a daily-rotating hash, and persistent recognition is an opt-in setting. You can verify the served script on the privacy proof page.' },
  { q: 'Do I need a cookie consent banner?', a: 'In its default mode aydex stores nothing on the visitor’s device, which typically avoids the need for a consent banner for analytics. This is not legal advice, so check the rules that apply to you.' },
  { q: 'Does aydex record user sessions?', a: 'No. It counts rage clicks, dead clicks, JavaScript errors, scroll depth, outbound links and downloads, and sends only a count plus a CSS selector or scrubbed message. It never captures screens, text or keystrokes.' },
  { q: 'What does “why your traffic changed” mean?', a: 'aydex compares each period with the one before and tells you which channel, referrer, page, country or device accounts for the change, plus new or lost sources and unusual days. Every sentence is computed from your own numbers.' },
  { q: 'Can I import my Google Analytics history?', a: 'Yes. Upload a daily CSV export from GA4 and your trend lines continue from before you switched. Imported days only fill dates before your first aydex pageview.' },
  { q: 'Is there an API?', a: 'Yes, on every plan, along with an MCP server so AI assistants such as Claude can answer questions about your traffic.' },
  { q: 'Can I get past ad blockers?', a: 'You can serve the script and collector from your own domain through a small proxy rule (nginx, Caddy or Next.js recipes are in the dashboard), so requests look first-party.' },
] as const
