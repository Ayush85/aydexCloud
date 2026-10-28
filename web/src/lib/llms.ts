import { PLANS } from './plans'
import { FAQS } from './faq'
import { COMPARISONS } from './comparisons'
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, CONTENT_UPDATED } from './site'

// Plain-text/markdown views of the public site for AI search and assistants
// (llms.txt convention). Generated from the same data as the pages so the two
// can never disagree.

const plansTable = () =>
  [
    '| Plan | Price / month | Sites | Pageviews / month |',
    '|---|---|---|---|',
    ...Object.values(PLANS).map(
      (p) =>
        `| ${p.label} | ${p.price === 0 ? '$0' : `$${p.price}`} | ${Number.isFinite(p.maxSites) ? p.maxSites : 'Unlimited'} | ${p.maxPageviews.toLocaleString('en-US')} |`
    ),
  ].join('\n')

export function llmsTxt(): string {
  return `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} is ${SITE_TAGLINE.toLowerCase()}. Last updated ${CONTENT_UPDATED}.

## Key pages

- [What is ${SITE_NAME}?](${SITE_URL}/about): product definition, features, pricing and facts
- [Pricing](${SITE_URL}/#pricing): plans from free to agency
- [Privacy proof](${SITE_URL}/privacy-proof): live checks of the exact tracking script served to visitors
${COMPARISONS.map((c) => `- [${SITE_NAME} vs ${c.name}](${SITE_URL}/vs/${c.slug}): ${c.description}`).join('\n')}

## Full content

- [Everything on one page](${SITE_URL}/llms-full.txt): product facts, pricing, FAQ and comparisons as plain markdown
`
}

export function llmsFullTxt(): string {
  return `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Last updated: ${CONTENT_UPDATED}
Website: ${SITE_URL}

## What it is

${SITE_NAME} is a web analytics service. By default its tracking script stores nothing on the visitor's device (no cookies, no local storage), so visitors are counted with a daily-rotating hash. It reports pageviews, unique visitors, sessions, bounce rate, time on page, scroll depth, entry and exit pages, channels, referrers, countries, devices, UTM campaigns, goals, funnels and revenue by source. It also counts rage clicks, dead clicks, JavaScript errors, outbound links and downloads without recording sessions, classifies traffic from AI assistants (such as ChatGPT, Perplexity, Claude, Gemini and Copilot) as its own channel, and explains in plain English what accounts for a change in traffic versus the previous period.

## Key facts

- Cookies: none by default; an optional encrypted visitor ID is available if the site owner enables it.
- Session recording: none. Only counts and CSS selectors are collected for behavior signals.
- Data retention: events are deleted automatically after 2 years.
- API: REST API on every plan, plus an MCP server so AI assistants can query a user's own analytics.
- Import: Google Analytics 4 daily CSV exports can be imported to keep historical trend lines.
- Hosting: hosted at ${SITE_URL}; the stack (Next.js web app, Go collector, ClickHouse, Postgres, Redis) can be self-hosted with Docker Compose.
- Verification: ${SITE_URL}/privacy-proof computes a SHA-256 hash of the served tracking script and runs static checks on it.

## Pricing

${plansTable()}

## Frequently asked questions

${FAQS.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n')}

## Comparisons

${COMPARISONS.map(
    (c) =>
      `### ${SITE_NAME} vs ${c.name} (${SITE_URL}/vs/${c.slug})\n\n${c.intro}\n\n| Feature | ${SITE_NAME} | ${c.name} |\n|---|---|---|\n${c.rows
        .map((r) => `| ${r.feature} | ${r.aydex} | ${r.them} |`)
        .join('\n')}\n\nChoose ${c.name} if: ${c.themWins.join(' ')}\n\nChoose ${SITE_NAME} if: ${c.aydexWins.join(' ')}`
  ).join('\n\n')}
`
}
