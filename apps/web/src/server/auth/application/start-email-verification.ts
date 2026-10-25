import { EmailDeliveryFailedError, EmailVerificationRateLimitError } from '../domain/errors'
import type { RequestSignupVerificationInput } from '../types/email-verification'
import type { PendingEmailVerificationOutput } from '../types/pending-email-verification'
import type { SignupVerificationRequester } from './ports/signup-verification-requester.port'

export async function startEmailVerification(
  input: RequestSignupVerificationInput,
  requester: SignupVerificationRequester,
): Promise<PendingEmailVerificationOutput> {
  let emailSent = true
  try {
    await requester.execute(input)
  } catch (error) {
    if (error instanceof EmailDeliveryFailedError) emailSent = false
    else if (!(error instanceof EmailVerificationRateLimitError)) throw error
  }
  return {
    outcome: 'PENDING_EMAIL_VERIFICATION',
    email: input.email,
    tenantId: input.tenantId,
    emailSent,
  }
}
