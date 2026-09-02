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
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Secret de build. Sem ele o upload de source maps é ignorado (o build não quebra).
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Envia mais arquivos do client para melhorar os stack traces do browser.
  widenClientFileUpload: true,

  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Silencioso localmente, verboso no CI — onde o log do upload é o que permite diagnosticar.
  silent: !process.env.CI,
})
