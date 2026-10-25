import type { AppLocale } from '@/i18n/types/locale.types'
import type { verifyPasswordResetCodeResponseSchema } from '@server/auth/schemas/password-reset-code.schema'

import type { FormEventHandler } from 'react'
import type { Control } from 'react-hook-form'
import type { z } from 'zod'

import type {
  createPasswordRecoverySchema,
  createPasswordResetSchema,
  createRecoveryTenantSchema,
} from '../schemas/password-recovery-schema'

export type PasswordRecoveryFormValues = z.infer<ReturnType<typeof createPasswordRecoverySchema>>

export type PasswordResetFormValues = z.infer<ReturnType<typeof createPasswordResetSchema>>

export type PasswordRecoveryFormProps = {
  control: Control<PasswordRecoveryFormValues>
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
}

export type PasswordResetFormProps = {
  control: Control<PasswordResetFormValues>
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  onResend: () => void
}

export type ResendCountdownButtonProps = {
  onResend: () => void
  seconds?: number
  disabled?: boolean
}

export type VerificationCodeStepProps = {
  control: Control<PasswordResetFormValues>
  isVerifying: boolean
  error: string | null
  onCodeComplete: () => void
  onResend: () => void
}

export type PasswordFieldName = 'password' | 'passwordConfirmation'

export type NewPasswordStepProps = {
  control: Control<PasswordResetFormValues>
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
}

export interface ResetPasswordInput {
  tenantId?: string
  email: string
  password: string
  resetToken: string
}

export type RecoveryStep = 'request' | 'code' | 'tenant' | 'newPassword' | 'done'

export type VerifyRecoveryResponse = z.infer<typeof verifyPasswordResetCodeResponseSchema>
export type RecoveryTenant = Extract<
  VerifyRecoveryResponse,
  { outcome: 'SELECT_TENANT' }
>['tenants'][number]
export type RecoveryTenantValues = z.infer<ReturnType<typeof createRecoveryTenantSchema>>

export interface RequestRecoveryInput {
  email: string
  locale: AppLocale
}

export interface VerifyRecoveryInput {
  email: string
  code: string
  tenantId?: string
}

export interface RecoveryState {
  step: RecoveryStep
  email: string
  resetToken: string
  tenantId?: string
  tenants: RecoveryTenant[]
}

export interface RecoveryTenantStepProps {
  control: Control<RecoveryTenantValues>
  tenants: RecoveryTenant[]
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  error?: string
  onBack: () => void
}
