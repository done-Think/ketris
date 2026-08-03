export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' && process.env.NEXT_RUNTIME !== 'edge') return

  const Sentry = await import('@sentry/nextjs')

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NEXT_PUBLIC_ENV ?? 'development',
  })
}
