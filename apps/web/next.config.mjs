import { withSentryConfig } from '@sentry/nextjs'
import createNextIntlPlugin from 'next-intl/plugin'

const configuredBuildWorkers = process.env.KETRIS_BUILD_WORKERS
  ? Number(process.env.KETRIS_BUILD_WORKERS)
  : undefined
if (
  configuredBuildWorkers !== undefined &&
  (!Number.isInteger(configuredBuildWorkers) || configuredBuildWorkers < 1)
) {
  throw new Error('KETRIS_BUILD_WORKERS deve ser um inteiro positivo.')
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    ...(configuredBuildWorkers ? { cpus: configuredBuildWorkers } : {}),
    ...(process.env.KETRIS_BUILD_LOW_MEMORY === '1' ? { webpackMemoryOptimizations: true } : {}),
  },
  serverExternalPackages: ['swagger-ui-dist'],
  images: {
    remotePatterns: [],
  },
  transpilePackages: ['@mui/x-charts', '@mui/x-data-grid'],
  turbopack: {
    rules: {
      '*.mp4': { type: 'asset' },
      '*.webm': { type: 'asset' },
    },
  },
  webpack(config, { dev }) {
    if (dev && config.cache && typeof config.cache === 'object') {
      config.cache.version = `${config.cache.version ?? ''}:rsc-non-negative-timings-v1`
    }

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

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,

  sourcemaps: {
    disable: process.env.KETRIS_BUILD_LOW_MEMORY === '1' && !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },

  silent: !process.env.CI,
  // org e project vem das variaveis de ambiente do Sentry
})
