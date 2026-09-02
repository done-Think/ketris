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

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
})
