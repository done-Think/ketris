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
}

export type VerificationCodeStepProps = {
  control: Control<PasswordResetFormValues>
  onCodeComplete: () => void
  onResend: () => void
}

export type PasswordFieldName = 'password' | 'passwordConfirmation'

export type NewPasswordStepProps = {
  control: Control<PasswordResetFormValues>
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
}

export interface ResetPasswordErrorBody {
  error?: { code?: string }
}

export interface ResetPasswordInput {
  email: string
  password: string
}
