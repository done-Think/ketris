import { z } from 'zod'

import { createChargeDateSchema } from './charge-date-schema'
import type { SchemaMessageTranslator } from '@shared/types'

export function createUpdateChargeSchema(t: SchemaMessageTranslator) {
  return z.object({
    description: z.string().trim().min(1, t('descriptionRequired')),
    amount: z.coerce.number().positive(t('amountPositive')),
    dueDate: createChargeDateSchema(t),
    direction: z.enum(['receivable', 'payable']),
    status: z.enum(['pending', 'overdue', 'paid', 'scheduled', 'cancelled']),
  })
}
