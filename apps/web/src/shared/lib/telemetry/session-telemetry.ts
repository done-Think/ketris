import * as Sentry from '@sentry/nextjs'
import { isAxiosError } from 'axios'

const message = 'auth.logout_revocation_failed'

export function reportLogoutRevocationFailure(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  const code = isAxiosError(error)
    ? (error.code ?? 'AXIOS_ERROR')
    : error instanceof Error
      ? error.name
      : 'UNKNOWN'

  Sentry.withScope((scope) => {
    // Strict allowlist: the request body, headers, URL and breadcrumbs may carry session tokens.
    scope.addEventProcessor((event) => ({
      event_id: event.event_id,
      timestamp: event.timestamp,
      platform: 'javascript',
      level: 'warning',
      message,
      tags: { module: 'auth', status: status ? String(status) : 'none', code },
    }))
    Sentry.captureMessage(message, 'warning')
  })
}
