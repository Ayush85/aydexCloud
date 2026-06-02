package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	clickhouse "github.com/ClickHouse/clickhouse-go/v2"
	"github.com/mileusna/useragent"
	"github.com/redis/go-redis/v9"
)

var pixel = []byte{
	0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
	0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
	0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x0a,
	0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
	0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x4c,
	0x01, 0x00, 0x3b,
}

const trackingScript = `(function(){
  var s=document.currentScript;
  if(!s)s=document.querySelector('script[data-site]');
  if(!s)return;
  var sid=s.getAttribute('data-site');
  if(!sid)return;
  var base=s.src.split('/').slice(0,3).join('/');
  function send(eventName,props){
    var p=encodeURIComponent(location.pathname+location.search);
    var r=encodeURIComponent(document.referrer||'');
    var w=screen.width;
    var q='?s='+sid+'&p='+p+'&r='+r+'&w='+w;
    if(eventName&&eventName!=='pageview'){
      q+='&e='+encodeURIComponent(eventName);
      if(props)q+='&ep='+encodeURIComponent(JSON.stringify(props));
    }
    new Image().src=base+'/collect'+q;
  }
  send();
  // Expose aydex.track() for custom events
  window.aydex={track:function(name,props){send(name,props);}};
})();`

var (
	db  clickhouse.Conn
	rdb *redis.Client
)

func main() {
	chAddr := getEnv("CLICKHOUSE_ADDR", "localhost:9000")

	var err error
	for i := 0; i < 40; i++ {
		db, err = clickhouse.Open(&clickhouse.Options{
			Addr:            []string{chAddr},
			Auth:            clickhouse.Auth{Database: "analytics", Username: "default"},
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

	// Redis — non-fatal if unavailable (live tracking degrades gracefully)
	rdb = redis.NewClient(&redis.Options{
		Addr:        getEnv("REDIS_ADDR", "localhost:6379"),
		DialTimeout: 3 * time.Second,
	})
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Printf("Redis unavailable (live tracking disabled): %v", err)
		rdb = nil
	} else {
		log.Println("Connected to Redis")
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/script.js", handleScript)
	mux.HandleFunc("/collect", handleCollect)
	mux.HandleFunc("/health", handleHealth)

	port := getEnv("PORT", "3001")
	log.Printf("Tracker listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

func ensureTable() error {
	return db.Exec(context.Background(), `
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
	`)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte("ok"))
}

func handleScript(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte(trackingScript))
}

func handleCollect(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "image/gif")
	defer w.Write(pixel)

	q := r.URL.Query()
	siteID := strings.TrimSpace(q.Get("s"))
	if siteID == "" {
		return
	}

	rawUA := r.Header.Get("User-Agent")
	ua := useragent.Parse(rawUA)
	if ua.Bot {
		return
	}

	pageURL, _ := url.QueryUnescape(q.Get("p"))
	if pageURL == "" {
		pageURL = "/"
	}
	referrer := cleanReferrer(q.Get("r"))
	eventName := q.Get("e")
	if eventName == "" {
		eventName = "pageview"
	}
	eventProps := q.Get("ep")

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
	today := time.Now().UTC().Format("2006-01-02")
	sum := sha256.Sum256([]byte(siteID + today + ip + rawUA))
	visitorHash := hex.EncodeToString(sum[:16])

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := db.Exec(ctx,
		`INSERT INTO analytics.pageviews
		 (site_id, timestamp, url, referrer, browser, os, device_type, visitor_hash, event_name, event_props)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		siteID, time.Now().UTC(), pageURL, referrer,
		browser, osName, deviceType, visitorHash, eventName, eventProps,
	); err != nil {
		log.Printf("CH insert error: %v", err)
	}

	// Track live visitor in Redis (sorted set, 10-min TTL per key)
	if rdb != nil {
		now := time.Now().Unix()
		pipe := rdb.Pipeline()
		pipe.ZAdd(ctx, "live:"+siteID, redis.Z{Score: float64(now), Member: visitorHash})
		pipe.ZRemRangeByScore(ctx, "live:"+siteID, "-inf",
			strconv.FormatInt(time.Now().Add(-10*time.Minute).Unix(), 10))
		pipe.Expire(ctx, "live:"+siteID, 15*time.Minute)
		if _, err := pipe.Exec(ctx); err != nil {
			log.Printf("Redis pipeline error: %v", err)
		}
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
