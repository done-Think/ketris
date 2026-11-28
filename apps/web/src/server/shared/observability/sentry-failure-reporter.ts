import * as Sentry from '@sentry/nextjs'

import { describeFailure } from './describe-failure'
import type { FailureReport, FailureReporter } from './failure-reporter.port'

const THROTTLE_WINDOW_MS = 60_000
const MAX_TRACKED_FAILURES = 500

export class SentryFailureReporter implements FailureReporter {
  private readonly lastReportedAt = new Map<string, number>()

  report({ module, operation, error }: FailureReport): void {
    const { name, code } = describeFailure(error)
    const key = `${module}:${operation}:${name}:${code}`
    const now = Date.now()
    const last = this.lastReportedAt.get(key)
    if (last !== undefined && now - last < THROTTLE_WINDOW_MS) return
    if (this.lastReportedAt.size >= MAX_TRACKED_FAILURES) this.lastReportedAt.clear()
    this.lastReportedAt.set(key, now)

    const message = `${module}.${operation}_failed`
    try {
      Sentry.withScope((scope) => {
        // Strict allowlist: recipients, tokens, error messages and request data never leave.
        scope.addEventProcessor((event) => ({
          event_id: event.event_id,
          timestamp: event.timestamp,
          platform: 'node',
          level: 'error',
          message,
          fingerprint: [module, operation, name, code],
          tags: { module, operation, errorName: name, errorCode: code },
        }))
        Sentry.captureMessage(message, 'error')
      })
    } catch {
      console.error(`[${module}] Failure report could not be sent.`)
    }
  }
}

export const failureReporter: FailureReporter = new SentryFailureReporter()
