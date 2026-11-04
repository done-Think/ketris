import * as Sentry from '@sentry/nextjs'

export function reportUnexpectedFaceCheckFailure() {
  Sentry.withScope((scope) => {
    // A strict event allowlist also removes inherited request URLs, user context and breadcrumbs.
    // Capture tokens and personal data must never reach diagnostic events.
    scope.addEventProcessor((event) => ({
      event_id: event.event_id,
      timestamp: event.timestamp,
      platform: 'javascript',
      level: 'error',
      message: 'face_check.unexpected_failure',
      tags: { module: 'face_check', code: 'INTERNAL_ERROR' },
    }))
    Sentry.captureMessage('face_check.unexpected_failure', 'error')
  })
}
