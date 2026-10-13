import { z } from 'zod'

import { createEmailSchema } from '@shared/schemas/email-schema'
import type { SchemaMessageTranslator } from '@shared/types'

export function createPasswordRecoverySchema(t: SchemaMessageTranslator) {
  return z.object({
    email: createEmailSchema(t),
  })
}

export function createVerificationCodeSchema(t: SchemaMessageTranslator) {
  return z.object({
    code: z.string().regex(/^\d{6}$/, t('codeInvalid')),
  })
}

export function createPasswordResetSchema(t: SchemaMessageTranslator) {
  return createVerificationCodeSchema(t)
    .extend({
      password: z.string().min(8, t('passwordTooShort')),
      passwordConfirmation: z.string().min(1, t('passwordConfirmationRequired')),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: t('passwordMismatch'),
      path: ['passwordConfirmation'],
    })
}
