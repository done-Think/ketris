import type { SchemaMessageTranslator } from '@shared/types'
import { z } from 'zod'

export function createMaintenanceProviderSchema(t: SchemaMessageTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('required')).max(200, t('nameTooLong')),
    phone: z.string().trim().max(50, t('phoneTooLong')),
    email: z
      .string()
      .trim()
      .max(254, t('emailTooLong'))
      .refine((value) => !value || z.string().email().safeParse(value).success, t('emailInvalid')),
    notes: z.string().trim().max(5000, t('notesTooLong')),
  })
}
