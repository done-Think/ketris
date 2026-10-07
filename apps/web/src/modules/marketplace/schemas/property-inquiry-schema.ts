import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createPropertyInquirySchema(t: SchemaMessageTranslator) {
  return z.object({
    leadName: z.string().trim().min(1, t('nameRequired')),
    leadEmail: z.string().trim().email(t('emailInvalid')),
    leadPhone: z.string().trim(),
    proposedValue: z.coerce.number().nonnegative(t('proposedValueInvalid')).optional(),
    notes: z.string().trim(),
  })
}
