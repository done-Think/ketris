const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''

// Acesso centralizado às variáveis de ambiente do client.
export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  apiUrl: `${configuredApiUrl}/api`,
  mapStyleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? '',
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
  environment: process.env.NEXT_PUBLIC_ENV ?? 'development',
} as const
