// Package filter holds the stdlib-only request-hygiene rules for the tracker:
// bot detection, referrer-spam blocking and event-name/props validation.
package filter

import (
	"encoding/json"
	"strings"
)

const (
	// MaxEventNameLen caps custom event names.
	MaxEventNameLen = 64
	// MaxPropsLen caps the raw JSON props string stored per event.
	MaxPropsLen = 1024
	// MaxURLLen caps stored page paths.
	MaxURLLen = 2048
)

// botMarkers are lower-case substrings of user agents that are not real
// visitors: headless browsers, HTTP libraries, monitors and crawlers. The
// tracker also consults a general user-agent parser; this list catches the
// automation and monitoring clients that parser does not flag.
var botMarkers = []string{
	"headlesschrome", "lighthouse", "phantomjs", "puppeteer", "playwright",
	"selenium", "webdriver", "python-requests", "python-urllib", "aiohttp",
	"curl/", "wget/", "go-http-client", "okhttp", "libwww", "scrapy",
	"httpclient", "node-fetch", "axios/", "postmanruntime", "insomnia",
	"pingdom", "uptimerobot", "statuscake", "gtmetrix", "site24x7",
	"bytespider", "petalbot", "semrush", "ahrefs", "mj12bot", "dotbot",
	"facebookexternalhit", "slackbot", "twitterbot", "linkedinbot",
	"discordbot", "telegrambot", "whatsapp/", "embedly", "bot/", "spider",
	"crawler",
}

// IsBotUA reports whether a raw User-Agent header looks automated. A missing
// user agent is treated as a bot: every real browser sends one.
func IsBotUA(ua string) bool {
	ua = strings.ToLower(strings.TrimSpace(ua))
	if ua == "" {
		return true
	}
	for _, m := range botMarkers {
		if strings.Contains(ua, m) {
			return true
		}
	}
	return false
}

var spamReferrers = map[string]struct{}{
	"semalt.com": {}, "buttons-for-website.com": {}, "darodar.com": {},
	"ilovevitaly.com": {}, "best-seo-offer.com": {}, "free-share-buttons.com": {},
	"100dollars-seo.com": {}, "get-free-traffic-now.com": {}, "event-tracking.com": {},
	"hulfingtonpost.com": {}, "makemoneyonline.com": {}, "buttons-for-your-website.com": {},
	"savetubevideo.com": {}, "trafficmonetize.org": {}, "trafficmonetizer.org": {},
	"webmonetizer.net": {}, "floating-share-buttons.com": {}, "social-buttons.com": {},
	"sharemyfile.ru": {}, "erot.co": {}, "o-o-6-o-o.ru": {},
}

// AddSpamReferrers registers extra blocked referrer hosts (e.g. from an env
// var), so operators can extend the list without a rebuild.
func AddSpamReferrers(hosts []string) {
	for _, h := range hosts {
		h = strings.ToLower(strings.TrimSpace(h))
		if h != "" {
			spamReferrers[h] = struct{}{}
		}
	}
}

// IsSpamReferrer reports whether a referrer host (already stripped of scheme
// and "www.") is a known referrer-spam domain or a subdomain of one.
func IsSpamReferrer(host string) bool {
	host = strings.ToLower(strings.TrimSpace(host))
	for host != "" {
		if _, ok := spamReferrers[host]; ok {
			return true
		}
		i := strings.IndexByte(host, '.')
		if i < 0 {
			return false
		}
		host = host[i+1:]
	}
	return false
}

// internalEvents are the event names the tracking script emits on its own.
// They are stored like any event but are excluded from the monthly pageview
// quota and from "custom events" in the dashboard.
var internalEvents = map[string]struct{}{
	"_dur": {}, "_rage": {}, "_dead": {}, "_err": {}, "_out": {}, "_dl": {},
}

// NormalizeEvent validates an incoming event name. An empty name means a
// pageview. Names starting with "_" are reserved for the script and only the
// known internal ones are accepted. ok is false when the event must be dropped.
func NormalizeEvent(name string) (clean string, internal bool, ok bool) {
	name = strings.TrimSpace(name)
	if name == "" {
		return "pageview", false, true
	}
	if len(name) > MaxEventNameLen {
		return "", false, false
	}
	if strings.HasPrefix(name, "_") {
		if _, known := internalEvents[name]; !known {
			return "", false, false
		}
		return name, true, true
	}
	return name, false, true
}

// ClampProps returns the props string if it is valid JSON within the size
// cap, otherwise an empty string (props are optional, so bad input is
// discarded rather than failing the whole event).
func ClampProps(ep string) string {
	if ep == "" || len(ep) > MaxPropsLen || !json.Valid([]byte(ep)) {
		return ""
	}
	return ep
}

// ClampURL truncates a page path to MaxURLLen bytes.
func ClampURL(p string) string {
	if len(p) > MaxURLLen {
		return p[:MaxURLLen]
	}
	return p
}
