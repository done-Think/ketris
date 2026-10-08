import type { FormEventHandler } from 'react'
import type { Control } from 'react-hook-form'

import type {
  PasswordRecoveryFormValues,
  PasswordResetFormValues,
} from '../schemas/password-recovery-schema'

export type {
  PasswordRecoveryFormValues,
  PasswordResetFormValues,
} from '../schemas/password-recovery-schema'

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
  email: string
  password: string
  resetToken: string
}
