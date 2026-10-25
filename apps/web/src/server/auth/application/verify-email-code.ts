import type { EmailVerificationRecord } from '../types/email-verification'
import { assertEmailCodeCanBeUsed, emailCodeMatches } from '../domain/email-verification'
import { InvalidEmailVerificationCodeError } from '../domain/errors'
import type { EmailVerificationRepository } from './ports/email-verification-repository.port'

export async function verifyEmailCode(
  record: EmailVerificationRecord | null,
  code: string,
  repository: EmailVerificationRepository,
): Promise<EmailVerificationRecord> {
  assertEmailCodeCanBeUsed(record)
  if (!emailCodeMatches(record.codeHash, code)) {
    await repository.incrementAttempts(record.id, record.userId, record.tenantId)
    throw new InvalidEmailVerificationCodeError()
  }
  return record
}
