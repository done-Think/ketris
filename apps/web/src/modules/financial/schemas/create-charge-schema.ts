import { z } from 'zod'

import { createChargeDateSchema, type SchemaMessageTranslator } from './charge-date-schema'

export function createChargeSchema(t: SchemaMessageTranslator) {
  return z.object({
    description: z.string().trim().min(1, t('descriptionRequired')),
    amount: z.coerce.number().positive(t('amountPositive')),
    dueDate: createChargeDateSchema(t),
    direction: z.enum(['receivable', 'payable']),
    status: z.enum(['pending', 'scheduled']),
  })
}
