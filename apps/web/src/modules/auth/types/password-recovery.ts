import type { FormEventHandler } from 'react'
import type { Control } from 'react-hook-form'

import type { PasswordRecoveryFormValues } from '../schemas/password-recovery-schema'

export type { PasswordRecoveryFormValues } from '../schemas/password-recovery-schema'

export type PasswordRecoveryFormProps = {
  control: Control<PasswordRecoveryFormValues>
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
}

export type PasswordRecoveryConfirmationProps = {
  onResend: () => void
}

export type ResendCountdownButtonProps = {
  onResend: () => void
  seconds?: number
}
