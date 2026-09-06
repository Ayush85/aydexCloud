const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@clickhouse/client'],
  },
}

// No-ops (and adds no build-time Sentry CLI calls) when SENTRY_DSN isn't set.
module.exports = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true })
  : nextConfig
