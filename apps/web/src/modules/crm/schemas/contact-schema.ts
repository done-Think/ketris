import { CRM_LIMITS } from '@server/crm/constants/validation'
import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export const contactTypeSchema = z.enum(['PROPRIETARIO', 'LOCATARIO', 'CORRETOR'])

export function createContactFormSchema(t: SchemaMessageTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('nameRequired')).max(CRM_LIMITS.name, t('textTooLong')),
    email: z.string().trim().max(CRM_LIMITS.email, t('emailInvalid')).email(t('emailInvalid')),
    phone: z.string().trim().max(CRM_LIMITS.phone, t('textTooLong')),
    type: contactTypeSchema,
    notes: z.string().trim().max(CRM_LIMITS.notes, t('textTooLong')),
  })
}
