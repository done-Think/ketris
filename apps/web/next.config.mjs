import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  // org e project vêm das variáveis de ambiente do Sentry
})
