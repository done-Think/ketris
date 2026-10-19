import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createAdminSchema(t: SchemaMessageTranslator) {
  return z
    .object({
      name: z.string().min(1, t('nameRequired')),
      email: z.string().min(1, t('emailRequired')).email(t('emailInvalid')),
      password: z.string().min(8, t('passwordTooShort')),
      confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    })
}
