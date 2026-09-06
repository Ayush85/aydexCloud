#!/bin/sh
# One-time (and periodic — MaxMind updates GeoLite2 weekly) helper to fetch the
# free GeoLite2-Country database into ./db/geoip, which the tracker container
# mounts read-only. Get a free license key at https://www.maxmind.com/en/geolite2/signup
# then: MAXMIND_LICENSE_KEY=xxxx ./scripts/update-geoip.sh
set -e

if [ -z "$MAXMIND_LICENSE_KEY" ]; then
  echo "Set MAXMIND_LICENSE_KEY (free account at maxmind.com) and re-run." >&2
  exit 1
fi

cd "$(dirname "$0")/.."
mkdir -p db/geoip
tmp=$(mktemp -d)

curl -fsSL "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${MAXMIND_LICENSE_KEY}&suffix=tar.gz" \
  -o "$tmp/GeoLite2-Country.tar.gz"

tar -xzf "$tmp/GeoLite2-Country.tar.gz" -C "$tmp"
find "$tmp" -name "GeoLite2-Country.mmdb" -exec cp {} db/geoip/GeoLite2-Country.mmdb \;
rm -rf "$tmp"

echo "Updated db/geoip/GeoLite2-Country.mmdb — restart the tracker container to pick it up."
