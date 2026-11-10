import { z } from 'zod'

import { isValidPhone } from '@shared/schemas/phone-schema'
import type { SchemaMessageTranslator } from '@shared/types'

export function createPropertyInquirySchema(
  t: SchemaMessageTranslator<
    'emailInvalid' | 'nameRequired' | 'phoneInvalid' | 'proposedValueInvalid'
  >,
) {
  return z.object({
    website: z.string().max(200).optional(),
    leadName: z.string().trim().min(1, t('nameRequired')),
    leadEmail: z.string().trim().email(t('emailInvalid')),
    leadPhone: z
      .string()
      .trim()
      .refine((value) => !value || isValidPhone(value), t('phoneInvalid')),
    proposedValue: z.preprocess(
      (value) => (value === '' || value === null || value === 0 ? undefined : value),
      z.coerce.number().positive(t('proposedValueInvalid')).optional(),
    ),
    notes: z.string().trim(),
  })
}
