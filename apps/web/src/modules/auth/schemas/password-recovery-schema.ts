import { z } from 'zod'

import { createEmailSchema, type SchemaMessageTranslator } from '@shared/schemas/email-schema'

export function createPasswordRecoverySchema(t: SchemaMessageTranslator) {
  return z.object({
    email: createEmailSchema(t),
  })
}

export type PasswordRecoveryFormValues = z.infer<ReturnType<typeof createPasswordRecoverySchema>>

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

export type PasswordResetFormValues = z.infer<ReturnType<typeof createPasswordResetSchema>>
