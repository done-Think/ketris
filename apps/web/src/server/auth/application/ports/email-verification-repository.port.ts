import type {
  ConfirmEmailCodeInput,
  EmailVerificationPurpose,
  EmailVerificationRecord,
  NewEmailVerificationCode,
} from '../../types/email-verification'

export interface EmailVerificationRepository {
  findLatest(
    userId: string,
    tenantId: string,
    purpose: EmailVerificationPurpose,
  ): Promise<EmailVerificationRecord | null>
  findById(id: string): Promise<EmailVerificationRecord | null>
  replace(input: NewEmailVerificationCode): Promise<EmailVerificationRecord | null>
  incrementAttempts(id: string, userId: string, tenantId: string): Promise<void>
  confirm(input: ConfirmEmailCodeInput): Promise<boolean>
}
