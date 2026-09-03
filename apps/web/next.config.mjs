import { withSentryConfig } from '@sentry/nextjs'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['swagger-ui-dist'],
  images: {
    remotePatterns: [],
  },
  transpilePackages: ['@mui/x-charts', '@mui/x-data-grid'],
  webpack(config) {
    config.infrastructureLogging = {
      ...(config.infrastructureLogging ?? {}),
      level: 'error',
    }

    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /next-intl[/\\]dist[/\\]esm[/\\]production[/\\]extractor[/\\]format[/\\]index\.js/,
        message: /Critical dependency|Parsing of .* for build dependencies failed/,
      },
    ]

    config.module.rules.push({
      test: /\.(mp4|webm)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]',
      },
    })

    return config
  },
}

const enableSentryReleaseUpload = process.env.SENTRY_ENABLE_RELEASE_UPLOAD === 'true'

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: enableSentryReleaseUpload,
  release: {
    create: enableSentryReleaseUpload,
    finalize: enableSentryReleaseUpload,
    setCommits: false,
  },
  sourcemaps: {
    deleteSourcemapsAfterUpload: enableSentryReleaseUpload,
    disable: !enableSentryReleaseUpload,
  },
  telemetry: false,
  // org e project vem das variaveis de ambiente do Sentry
})
