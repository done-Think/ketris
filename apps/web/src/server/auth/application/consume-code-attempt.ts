import { normalizeEmail } from '@server/shared/normalize-email'

import { TooManyCodeAttemptsError } from '../domain/errors'
import type { CodeAttemptLimiter, CodeAttemptScope } from './ports/code-attempt-limiter.port'

export async function guardCodeAttempts<T>(
  limiter: CodeAttemptLimiter,
  scope: CodeAttemptScope,
  email: string,
  failure: new (...args: never[]) => Error,
  run: () => Promise<T>,
): Promise<T> {
  const key = normalizeEmail(email)
  if (await limiter.isBlocked(scope, key)) throw new TooManyCodeAttemptsError()
  try {
    return await run()
  } catch (error) {
    if (error instanceof failure) await limiter.recordFailure(scope, key)
    throw error
  }
}
