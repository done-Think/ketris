import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createPropertyInquirySchema(t: SchemaMessageTranslator) {
  return z.object({
    leadName: z.string().trim().min(1, t('nameRequired')),
    leadEmail: z.string().trim().email(t('emailInvalid')),
    leadPhone: z.string().trim(),
    // Same rule as the API: an empty field means no proposed value, otherwise it must be positive.
    proposedValue: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.coerce.number().positive(t('proposedValueInvalid')).optional(),
    ),
    notes: z.string().trim(),
  })
}
