package main

import (
	"context"
	"crypto/sha256"
	"crypto/tls"
	_ "embed"
	"encoding/hex"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"tracker/internal/filter"

	clickhouse "github.com/ClickHouse/clickhouse-go/v2"
	"github.com/getsentry/sentry-go"
	"github.com/mileusna/useragent"
	"github.com/oschwald/geoip2-golang"
	"github.com/redis/go-redis/v9"
)

// Requests from a single IP+site over this many events per minute are logged
// but not written to ClickHouse — the pixel still returns so a hammered
// customer site never visibly breaks.
const rateLimitPerMinute = 300

// Internal behaviour signals (_dur, _rage, ...) have their own, higher limit and
// never count toward the monthly quota or the live-visitor set.
const internalRateLimitPerMinute = 900

var pixel = []byte{
	0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
	0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
	0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x0a,
	0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
	0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x4c,
	0x01, 0x00, 0x3b,
}

//go:embed script.js
var trackingScript string

var (
	db        clickhouse.Conn
	rdb       *redis.Client
	geoReader *geoip2.Reader
)

func main() {
	if dsn := os.Getenv("SENTRY_DSN"); dsn != "" {
		if err := sentry.Init(sentry.ClientOptions{Dsn: dsn}); err != nil {
			log.Printf("Sentry init failed: %v", err)
		} else {
			defer sentry.Flush(2 * time.Second)
			log.Println("Sentry enabled")
		}
	}

	if reader, err := geoip2.Open(getEnv("GEOIP_DB_PATH", "/data/GeoLite2-Country.mmdb")); err != nil {
		log.Printf("GeoIP database unavailable (country data disabled): %v", err)
	} else {
		geoReader = reader
		log.Println("Loaded GeoIP database")
	}

	chAddr := getEnv("CLICKHOUSE_ADDR", "localhost:9000")

	var chTLS *tls.Config
	if getEnv("CLICKHOUSE_TLS", "false") == "true" {
		chTLS = &tls.Config{}
	}

	if extra := os.Getenv("SPAM_REFERRERS"); extra != "" {
		filter.AddSpamReferrers(strings.Split(extra, ","))
	}

	var err error
	for i := 0; i < 40; i++ {
		db, err = clickhouse.Open(&clickhouse.Options{
			Addr: []string{chAddr},
			Auth: clickhouse.Auth{
				Database: getEnv("CLICKHOUSE_DB", "analytics"),
				Username: getEnv("CLICKHOUSE_USER", "default"),
				Password: getEnv("CLICKHOUSE_PASSWORD", ""),
			},
			TLS:             chTLS,
			DialTimeout:     5 * time.Second,
			MaxOpenConns:    20,
			MaxIdleConns:    5,
			ConnMaxLifetime: time.Hour,
		})
		if err == nil {
			if pingErr := db.Ping(context.Background()); pingErr == nil {
				break
			} else {
				err = pingErr
			}
		}
		log.Printf("ClickHouse not ready (%d/40): %v", i+1, err)
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		log.Fatalf("Cannot connect to ClickHouse: %v", err)
	}
	log.Println("Connected to ClickHouse")

	if err := ensureTable(); err != nil {
		log.Fatalf("Table creation failed: %v", err)
	}

	// Redis — non-fatal if unavailable (live tracking degrades gracefully).
	// ParseURL (not a bare host:port) so a managed provider's rediss://
	// connection string carries its password and TLS config automatically.
	redisOpts, err := redis.ParseURL(getEnv("REDIS_URL", "redis://localhost:6379"))
	if err != nil {
		log.Fatalf("Invalid REDIS_URL: %v", err)
	}
	redisOpts.DialTimeout = 3 * time.Second
	rdb = redis.NewClient(redisOpts)
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Printf("Redis unavailable (live tracking disabled): %v", err)
		rdb = nil
	} else {
		log.Println("Connected to Redis")
	}

	mux := http.NewServeMux()
	// /s.js and /e are neutral aliases that content blockers match less often.
	for _, p := range []string{"/script.js", "/s.js"} {
		mux.HandleFunc(p, handleScript)
	}
	for _, p := range []string{"/collect", "/e"} {
		mux.HandleFunc(p, handleCollect)
	}
	mux.HandleFunc("/health", handleHealth)

	port := getEnv("PORT", "3001")
	log.Printf("Tracker listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

func ensureTable() error {
	ctx := context.Background()
	if err := db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS analytics.pageviews
		(
			site_id      String,
			timestamp    DateTime,
			url          String,
			referrer     String,
			browser      LowCardinality(String),
			os           LowCardinality(String),
			device_type  LowCardinality(String),
			visitor_hash String,
			event_name   LowCardinality(String) DEFAULT 'pageview',
			event_props  String DEFAULT ''
		)
		ENGINE = MergeTree()
		PARTITION BY toYYYYMM(timestamp)
		ORDER BY (site_id, timestamp)
		TTL timestamp + INTERVAL 2 YEAR
		SETTINGS index_granularity = 8192
	`); err != nil {
		return err
	}
	// Idempotent migration for installs created before country tracking existed.
	if err := db.Exec(ctx, `ALTER TABLE analytics.pageviews ADD COLUMN IF NOT EXISTS country LowCardinality(String) DEFAULT ''`); err != nil {
		return err
	}
	// Daily aggregates imported from other tools (e.g. a GA4 CSV export). Only
	// ever used for dates before a site's first native event.
	return db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS analytics.imported_daily
		(
			site_id    String,
			date       Date,
			source     LowCardinality(String) DEFAULT 'ga4',
			pageviews  UInt64,
			visitors   UInt64,
			sessions   UInt64 DEFAULT 0,
			imported_at DateTime DEFAULT now()
		)
		ENGINE = ReplacingMergeTree(imported_at)
		ORDER BY (site_id, date, source)
	`)
}

// shouldDrop reports whether a counter has exceeded its limit. A negative
// limit means unlimited (used for plans with no pageview cap).
func shouldDrop(count, limit int64) bool {
	if limit < 0 {
		return false
	}
	return count > limit
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte("ok"))
}

func handleScript(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.WriteHeader(http.StatusNoContent)
		return
	}
	w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte(trackingScript))
}

func handleCollect(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	w.Header().Set("Content-Type", "image/gif")
	defer w.Write(pixel)

	q := r.URL.Query()
	siteID := strings.TrimSpace(q.Get("s"))
	if siteID == "" {
		return
	}

	rawUA := r.Header.Get("User-Agent")
	ua := useragent.Parse(rawUA)
	if ua.Bot || filter.IsBotUA(rawUA) {
		return
	}

	eventName, internal, ok := filter.NormalizeEvent(q.Get("e"))
	if !ok {
		return
	}
	pageURL := filter.ClampURL(q.Get("p"))
	referrer := cleanReferrer(q.Get("r"))
	if filter.IsSpamReferrer(referrer) {
		return
	}
	eventProps := filter.ClampProps(q.Get("ep"))

	browser := ua.Name
	if browser == "" {
		browser = "Unknown"
	}
	osName := ua.OS
	if osName == "" {
		osName = "Unknown"
	}
	deviceType := "desktop"
	if ua.Mobile {
		deviceType = "mobile"
	} else if ua.Tablet {
		deviceType = "tablet"
	}

	ip := realIP(r)

	// If the tracking snippet sent a persistent client-side visitor id (opt-in via
	// data-storage on the snippet), hash that instead — stable across days for the
	// same visitor. Otherwise fall back to the default daily-rotating IP+UA hash.
	var visitorHash string
	if vid := strings.TrimSpace(q.Get("v")); vid != "" {
		sum := sha256.Sum256([]byte(siteID + vid))
		visitorHash = hex.EncodeToString(sum[:16])
	} else {
		today := time.Now().UTC().Format("2006-01-02")
		sum := sha256.Sum256([]byte(siteID + today + ip + rawUA))
		visitorHash = hex.EncodeToString(sum[:16])
	}

	country := ""
	if geoReader != nil {
		if parsed := net.ParseIP(ip); parsed != nil {
			if record, err := geoReader.Country(parsed); err == nil {
				country = record.Country.IsoCode
			}
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	now := time.Now()
	drop := false

	// Rate limiting + monthly quota + live-visitor tracking, all in one Redis
	// round trip. Fails open (never drops writes) if Redis is unavailable —
	// same graceful-degradation philosophy as the rest of this service.
	if rdb != nil {
		drop = limitAndTrack(ctx, now, ip, siteID, visitorHash, internal)
	}

	if drop {
		return
	}

	if err := db.Exec(ctx,
		`INSERT INTO analytics.pageviews
		 (site_id, timestamp, url, referrer, browser, os, device_type, visitor_hash, event_name, event_props, country)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		siteID, now.UTC(), pageURL, referrer,
		browser, osName, deviceType, visitorHash, eventName, eventProps, country,
	); err != nil {
		log.Printf("CH insert error: %v", err)
		captureError(err)
	}
}

// limitAndTrack applies the per-IP rate limit and (for real pageviews/custom
// events only) the monthly quota and live-visitor tracking. It reports whether
// the event should be dropped and fails open on Redis errors.
func limitAndTrack(ctx context.Context, now time.Time, ip, siteID, visitorHash string, internal bool) bool {
	pipe := rdb.Pipeline()
	if internal {
		key := "ratelimit:i:" + ip + ":" + siteID + ":" + now.Format("200601021504")
		rateCmd := pipe.Incr(ctx, key)
		pipe.Expire(ctx, key, 65*time.Second)
		if _, err := pipe.Exec(ctx); err != nil && err != redis.Nil {
			log.Printf("Redis pipeline error: %v", err)
			captureError(err)
			return false
		}
		return shouldDrop(rateCmd.Val(), internalRateLimitPerMinute)
	}

	minuteKey := "ratelimit:" + ip + ":" + siteID + ":" + now.Format("200601021504")
	monthKey := "quota:used:" + siteID + ":" + now.Format("200601")
	limitKey := "quota:limit:" + siteID

	rateCmd := pipe.Incr(ctx, minuteKey)
	pipe.Expire(ctx, minuteKey, 65*time.Second)
	quotaCmd := pipe.Incr(ctx, monthKey)
	pipe.Expire(ctx, monthKey, 35*24*time.Hour)
	limitCmd := pipe.Get(ctx, limitKey)
	pipe.ZAdd(ctx, "live:"+siteID, redis.Z{Score: float64(now.Unix()), Member: visitorHash})
	pipe.ZRemRangeByScore(ctx, "live:"+siteID, "-inf",
		strconv.FormatInt(now.Add(-10*time.Minute).Unix(), 10))
	pipe.Expire(ctx, "live:"+siteID, 15*time.Minute)
	if _, err := pipe.Exec(ctx); err != nil && err != redis.Nil {
		log.Printf("Redis pipeline error: %v", err)
		captureError(err)
		return false
	}
	if shouldDrop(rateCmd.Val(), rateLimitPerMinute) {
		return true
	}
	// Missing limit key = no plan synced yet; default to the Free tier cap.
	limit := int64(10_000)
	if limitStr, err := limitCmd.Result(); err == nil {
		if parsed, err := strconv.ParseInt(limitStr, 10, 64); err == nil {
			limit = parsed
		}
	}
	return shouldDrop(quotaCmd.Val(), limit)
}

func captureError(err error) {
	if sentry.CurrentHub().Client() != nil {
		sentry.CaptureException(err)
	}
}

func realIP(r *http.Request) string {
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return strings.TrimSpace(ip)
	}
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		return strings.TrimSpace(strings.Split(fwd, ",")[0])
	}
	ip := r.RemoteAddr
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		return ip[:idx]
	}
	return ip
}

func cleanReferrer(raw string) string {
	if raw == "" {
		return ""
	}
	decoded, err := url.QueryUnescape(raw)
	if err != nil {
		return ""
	}
	u, err := url.Parse(decoded)
	if err != nil || u.Host == "" {
		return ""
	}
	return strings.TrimPrefix(u.Host, "www.")
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
