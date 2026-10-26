import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

import { createChargeDateSchema } from './charge-date-schema'

export function createChargeFormSchema(t: SchemaMessageTranslator, descriptionRequired = true) {
  const description = z.string().trim().max(500, t('descriptionTooLong'))

  return z.object({
    description: descriptionRequired ? description.min(1, t('descriptionRequired')) : description,
    amount: z.coerce.number().positive(t('amountPositive')).max(9999999999.99, t('amountTooHigh')),
    dueDate: createChargeDateSchema(t),
    direction: z.enum(['receivable', 'payable']),
    status: z.enum(['pending', 'scheduled']),
  })
}
