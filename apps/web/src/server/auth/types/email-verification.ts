import type { AppLocale } from '@/i18n/types/locale.types'
import type { UserRole } from '../domain/user.entity'
import type { LoginOutput } from './use-case-outputs'

export type AuthCodeEmailNamespace = 'passwordResetEmail' | 'signupEmail' | 'emailChangeEmail'
export type ConfirmSignupVerificationOutput =
  ({ outcome: 'REGISTERED' } & LoginOutput) | { outcome: 'PENDING_APPROVAL'; email: string }

export type EmailVerificationPurpose = 'SIGNUP' | 'EMAIL_CHANGE'

export interface EmailVerificationRecord {
  id: string
  userId: string
  tenantId: string
  targetEmail: string
  purpose: EmailVerificationPurpose
  codeHash: string
  attempts: number
  expiresAt: Date
  createdAt: Date
  consumedAt: Date | null
}

export interface NewEmailVerificationCode {
  userId: string
  tenantId: string
  targetEmail: string
  purpose: EmailVerificationPurpose
  codeHash: string
  expiresAt: Date
}

export interface ConfirmEmailCodeInput {
  id: string
  userId: string
  tenantId: string
  currentEmail: string
  targetEmail: string
  purpose: EmailVerificationPurpose
  codeHash: string
}

export interface RequestSignupVerificationInput {
  email: string
  tenantId: string
  locale: AppLocale
}

export interface ConfirmSignupVerificationInput {
  email: string
  tenantId: string
  code: string
}

export interface RequestEmailChangeInput {
  targetUserId?: string
  actorRole?: UserRole
  actorId: string
  actorTenantId: string
  email: string
  locale: AppLocale
}

export interface ConfirmEmailChangeInput {
  actorId: string
  actorTenantId: string
  email: string
  code: string
}
