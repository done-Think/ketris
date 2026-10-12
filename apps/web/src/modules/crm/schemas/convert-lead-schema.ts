import { z } from 'zod'

import type { SchemaMessageTranslator } from './opportunity-schema'

export function createConvertLeadSchema(t: SchemaMessageTranslator) {
  return z.object({
    propertyId: z.string().trim().min(1, t('propertyRequired')),
    proposedValue: z.number().positive(t('proposedValueInvalid')),
  })
}
