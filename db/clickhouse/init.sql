CREATE DATABASE IF NOT EXISTS analytics;

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
    event_props  String DEFAULT '',
    country      LowCardinality(String) DEFAULT ''
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (site_id, timestamp)
TTL timestamp + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;

-- Daily aggregates imported from other tools (e.g. a GA4 CSV export). Only ever
-- used for dates before a site's first native event.
CREATE TABLE IF NOT EXISTS analytics.imported_daily
(
    site_id     String,
    date        Date,
    source      LowCardinality(String) DEFAULT 'ga4',
    pageviews   UInt64,
    visitors    UInt64,
    sessions    UInt64 DEFAULT 0,
    imported_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(imported_at)
ORDER BY (site_id, date, source);
