import { z } from 'zod'

import type { SchemaMessageTranslator } from './update-current-user-profile-schema'
import { createUpdateCurrentUserProfileSchema } from './update-current-user-profile-schema'
import { createPhoneSchema } from './registration-details-schema'

export function createCurrentUserProfileSchema(t: SchemaMessageTranslator) {
  return createUpdateCurrentUserProfileSchema(t).extend({
    phone: createPhoneSchema(t),
  })
}

export function createChangeOwnPasswordSchema(t: SchemaMessageTranslator) {
  return z
    .object({
      password: z.string().min(8, t('passwordTooShort')),
      passwordConfirmation: z.string().min(1, t('passwordConfirmationRequired')),
    })
    .refine((values) => values.password === values.passwordConfirmation, {
      message: t('passwordMismatch'),
      path: ['passwordConfirmation'],
    })
}
