import type { z } from 'zod'

import type { AppLocale } from '@/i18n/types/locale.types'
import type { TenantUser } from './user'
import type {
  createPasswordRecoverySchema,
  createVerificationCodeSchema,
} from '../schemas/password-recovery-schema'

import type {
  createChangeOwnPasswordSchema,
  createCurrentUserProfileSchema,
} from '../schemas/current-user-profile-schema'
import type { createUpdateCurrentUserProfileSchema } from '../schemas/update-current-user-profile-schema'

export type CurrentUserProfileValues = z.infer<ReturnType<typeof createCurrentUserProfileSchema>>
export type ChangeOwnPasswordValues = z.infer<ReturnType<typeof createChangeOwnPasswordSchema>>
export type UpdateCurrentUserProfileValues = z.infer<
  ReturnType<typeof createUpdateCurrentUserProfileSchema>
>

export interface ChangeOwnPasswordPayload {
  currentPassword: string
  password: string
}

export interface CurrentUserProfileFormProps {
  user: TenantUser
}

export interface EmailChangeDialogProps {
  onClose: () => void
}

export interface EmailChangeRequestPayload {
  email: string
  locale: AppLocale
}

export interface EmailChangeConfirmPayload {
  email: string
  code: string
}

export type EmailChangeValues = z.infer<ReturnType<typeof createPasswordRecoverySchema>>
export type EmailChangeCodeValues = z.infer<ReturnType<typeof createVerificationCodeSchema>>
