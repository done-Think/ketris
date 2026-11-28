import * as Sentry from '@sentry/nextjs'
import type { Instrumentation } from 'next'

import { sanitizeInstagramTelemetry } from '@shared/lib/telemetry/instagram-telemetry'

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

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  Sentry.captureRequestError(error, sanitizeInstagramTelemetry(request), context)
}
