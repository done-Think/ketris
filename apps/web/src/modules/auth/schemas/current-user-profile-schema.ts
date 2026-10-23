import { z } from 'zod'

import { createPhoneSchema } from '@shared/schemas/phone-schema'
import type { SchemaMessageTranslator } from '@shared/types'
import { createUpdateCurrentUserProfileSchema } from './update-current-user-profile-schema'

export function createCurrentUserProfileSchema(t: SchemaMessageTranslator) {
  return createUpdateCurrentUserProfileSchema(t).extend({
    phone: createPhoneSchema(t),
  })
}

export function createChangeOwnPasswordSchema(t: SchemaMessageTranslator) {
  return z
    .object({
      currentPassword: z.string().min(1, t('currentPasswordRequired')),
      password: z.string().min(8, t('passwordTooShort')),
      passwordConfirmation: z.string().min(1, t('passwordConfirmationRequired')),
    })
    .refine((values) => values.password === values.passwordConfirmation, {
      message: t('passwordMismatch'),
      path: ['passwordConfirmation'],
    })
}
