import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createPropertyInquirySchema(
  t: SchemaMessageTranslator<'emailInvalid' | 'nameRequired' | 'proposedValueInvalid'>,
) {
  return z.object({
    website: z.string().max(200).optional(),
    leadName: z.string().trim().min(1, t('nameRequired')),
    leadEmail: z.string().trim().email(t('emailInvalid')),
    leadPhone: z.string().trim(),
    proposedValue: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.coerce.number().positive(t('proposedValueInvalid')).optional(),
    ),
    notes: z.string().trim(),
  })
}
