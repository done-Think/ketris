import type { RequestSignupVerificationInput } from '../../types/email-verification'

export interface SignupVerificationRequester {
  execute(input: RequestSignupVerificationInput): Promise<void>
}
