import { z } from 'zod'

import type { SchemaMessageTranslator } from './create-tenant-schema'

export function createTenantAdminSchema(t: SchemaMessageTranslator) {
  return z
    .object({
      nome: z.string().min(1, t('nameRequired')),
      email: z.string().min(1, t('emailRequired')).email(t('emailInvalid')),
      password: z.string().min(8, t('passwordTooShort')),
      confirmarSenha: z.string().min(1, t('passwordConfirmationRequired')),
    })
    .refine((data) => data.password === data.confirmarSenha, {
      message: t('passwordsDoNotMatch'),
      path: ['confirmarSenha'],
    })
}

export type CreateTenantAdminFormValues = z.infer<ReturnType<typeof createTenantAdminSchema>>
