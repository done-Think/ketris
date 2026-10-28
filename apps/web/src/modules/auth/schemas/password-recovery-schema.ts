import { z } from 'zod'

import { createNewPasswordSchema } from '@shared/schemas/new-password-schema'
import { createEmailSchema } from '@shared/schemas/email-schema'
import type { SchemaMessageTranslator } from '@shared/types'

export function createPasswordRecoverySchema(
  t: SchemaMessageTranslator<'emailRequired' | 'emailInvalid'>,
) {
  return z.object({
    email: createEmailSchema(t).pipe(z.string().max(254, t('emailInvalid'))),
  })
}

export function createVerificationCodeSchema(t: SchemaMessageTranslator<'codeInvalid'>) {
  return z.object({
    code: z.string().regex(/^\d{6}$/, t('codeInvalid')),
  })
}

export function createPasswordResetSchema(
  t: SchemaMessageTranslator<
    | 'codeInvalid'
    | 'passwordTooShort'
    | 'passwordTooLong'
    | 'passwordConfirmationRequired'
    | 'passwordMismatch'
  >,
) {
  return createVerificationCodeSchema(t)
    .extend({
      password: createNewPasswordSchema(t),
      passwordConfirmation: z.string().min(1, t('passwordConfirmationRequired')),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: t('passwordMismatch'),
      path: ['passwordConfirmation'],
    })
}

export function createRecoveryTenantSchema(t: SchemaMessageTranslator<'tenantRequired'>) {
  return z.object({ tenantId: z.string().min(1, t('tenantRequired')) })
}
