import { z } from 'zod'

import { createChargeDateSchema, type SchemaMessageTranslator } from './charge-date-schema'

export function createRegisterPaymentSchema(t: SchemaMessageTranslator) {
  return z.object({
    paymentDate: createChargeDateSchema(t),
    paymentMethod: z.string().trim().min(1, t('paymentMethodRequired')),
  })
}
