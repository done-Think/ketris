import { CRM_LIMITS } from '@server/crm/constants/validation'
import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export const contactTypeSchema = z.enum(['OWNER', 'RENTER', 'BROKER'])

export function createContactFormSchema(
  t: SchemaMessageTranslator<'avatarUrlInvalid' | 'emailInvalid' | 'nameRequired' | 'textTooLong'>,
) {
  return z.object({
    name: z.string().trim().min(1, t('nameRequired')).max(CRM_LIMITS.name, t('textTooLong')),
    email: z.string().trim().max(CRM_LIMITS.email, t('emailInvalid')).email(t('emailInvalid')),
    phone: z.string().trim().max(CRM_LIMITS.phone, t('textTooLong')),
    type: contactTypeSchema,
    avatarUrl: z
      .string()
      .trim()
      .max(2048, t('textTooLong'))
      .url(t('avatarUrlInvalid'))
      .refine((value) => /^https?:\/\//i.test(value), t('avatarUrlInvalid'))
      .or(z.literal(''))
      .optional(),
    notes: z.string().trim().max(CRM_LIMITS.notes, t('textTooLong')),
  })
}
