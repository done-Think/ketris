import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['swagger-ui-dist'],
  },
  images: {
    remotePatterns: [
      // Configure aqui os domínios do S3/CDN de imagens dos imóveis
      // { protocol: 'https', hostname: 'seu-bucket.s3.amazonaws.com' },
    ],
  },
  // MUI v6 + Emotion: transpila pacotes que enviam ESM
  transpilePackages: ['@mui/x-charts', '@mui/x-data-grid'],
}

export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  // org e project vem das variaveis de ambiente do Sentry
})
