export type CodeAttemptScope = 'PASSWORD_RESET' | 'SIGNUP_VERIFICATION' | 'EMAIL_CHANGE'

export interface CodeAttemptLimiter {
  isBlocked(scope: CodeAttemptScope, email: string): Promise<boolean>
  recordFailure(scope: CodeAttemptScope, email: string): Promise<void>
}
