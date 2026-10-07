import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createConvertLeadSchema(t: SchemaMessageTranslator) {
  return z.object({
    propertyId: z.string().min(1, t('propertyRequired')),
    proposedValue: z.coerce.number().positive(t('proposedValueInvalid')),
  })
}
