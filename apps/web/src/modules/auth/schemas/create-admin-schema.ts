import { z } from 'zod'

export type SchemaMessageTranslator = (key: string) => string

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

export type CreateAdminFormValues = z.infer<ReturnType<typeof createAdminSchema>>
