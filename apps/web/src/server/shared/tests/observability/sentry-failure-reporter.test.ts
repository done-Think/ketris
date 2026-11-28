import * as Sentry from '@sentry/nextjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SentryFailureReporter } from '../../observability/sentry-failure-reporter'
import { describeFailure } from '../../observability/describe-failure'

vi.mock('@sentry/nextjs', () => ({
  withScope: vi.fn((callback: (scope: unknown) => void) => callback(scope)),
  captureMessage: vi.fn(),
}))

type Processor = (event: Record<string, unknown>) => Record<string, unknown>
const processors: Processor[] = []
const scope = { addEventProcessor: (processor: Processor) => processors.push(processor) }

class SesError extends Error {
  readonly $metadata = { httpStatusCode: 400 }
  constructor() {
    super('Email address is not verified: ana@example.test')
    this.name = 'MessageRejected'
  }
}

describe('describeFailure', () => {
  it('extracts a name and code without exposing the message', () => {
    expect(describeFailure(new SesError())).toEqual({ name: 'MessageRejected', code: '400' })
    expect(describeFailure(Object.assign(new Error('x'), { code: 'ECONNRESET' }))).toEqual({
      name: 'Error',
      code: 'ECONNRESET',
    })
    expect(describeFailure('boom')).toEqual({ name: 'UnknownError', code: 'none' })
  })
})

describe('SentryFailureReporter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-01T10:00:00Z'))
    vi.clearAllMocks()
    processors.length = 0
  })
  afterEach(() => vi.useRealTimers())

  it('captures an allowlisted event with the error name and code but no recipient or message', () => {
    new SentryFailureReporter().report({
      module: 'auth',
      operation: 'password_reset_email',
      error: new SesError(),
    })

    expect(Sentry.captureMessage).toHaveBeenCalledWith('auth.password_reset_email_failed', 'error')
    const event = processors[0]({
      request: { url: 'https://app/?token=secret' },
      user: { email: 'ana@example.test' },
      extra: { to: 'ana@example.test' },
      exception: { values: [{ value: 'Email address is not verified: ana@example.test' }] },
      event_id: 'evt-1',
    })
    expect(event).toMatchObject({
      message: 'auth.password_reset_email_failed',
      tags: {
        module: 'auth',
        operation: 'password_reset_email',
        errorName: 'MessageRejected',
        errorCode: '400',
      },
    })
    expect(JSON.stringify(event)).not.toContain('ana@example.test')
    expect(JSON.stringify(event)).not.toContain('secret')
  })

  it('throttles repeated reports of the same failure and resumes after the window', () => {
    const reporter = new SentryFailureReporter()
    const failure = { module: 'auth', operation: 'password_reset_email', error: new SesError() }

    reporter.report(failure)
    reporter.report(failure)
    reporter.report(failure)
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(61_000)
    reporter.report(failure)
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
  })

  it('does not throttle different operations or error kinds against each other', () => {
    const reporter = new SentryFailureReporter()
    reporter.report({ module: 'auth', operation: 'password_reset_email', error: new SesError() })
    reporter.report({ module: 'team', operation: 'invitation_email', error: new SesError() })
    reporter.report({ module: 'team', operation: 'invitation_email', error: new TypeError('x') })
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(3)
  })

  it('never throws, even if Sentry itself fails', () => {
    vi.mocked(Sentry.withScope).mockImplementationOnce(() => {
      throw new Error('sentry down')
    })
    expect(() =>
      new SentryFailureReporter().report({ module: 'auth', operation: 'x', error: new Error('y') }),
    ).not.toThrow()
  })
})
