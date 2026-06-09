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
    event_props  String DEFAULT ''
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (site_id, timestamp)
TTL timestamp + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;
