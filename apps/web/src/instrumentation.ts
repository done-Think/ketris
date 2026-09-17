import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
    return
  }

  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  await import('./sentry.server.config')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  console.log(`   - Docs (Swagger):      ${appUrl}/api/docs`)
}

// Captura erros não tratados de requisições no servidor (requer @sentry/nextjs >= 8.28.0).
export const onRequestError = Sentry.captureRequestError
