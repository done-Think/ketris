import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createPlatformAdminSchema(
  t: SchemaMessageTranslator<
    | 'emailInvalid'
    | 'emailRequired'
    | 'nameRequired'
    | 'passwordConfirmationRequired'
    | 'passwordTooShort'
    | 'passwordsDoNotMatch'
  >,
) {
  return z
    .object({
      name: z.string().min(1, t('nameRequired')),
      email: z.string().min(1, t('emailRequired')).email(t('emailInvalid')),
      password: z.string().min(8, t('passwordTooShort')),
      confirmPassword: z.string().min(1, t('passwordConfirmationRequired')),
      role: z.enum(['ADMIN', 'ADMIN_AGENT', 'AGENT']),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwordsDoNotMatch'),
      path: ['confirmPassword'],
    })
}
