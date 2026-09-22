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
