import { z } from 'zod'

import { createChargeDateSchema } from './charge-date-schema'
import type { SchemaMessageTranslator } from '@shared/types'

export function createRegisterPaymentSchema(t: SchemaMessageTranslator) {
  return z.object({
    paymentDate: createChargeDateSchema(t),
    paymentMethod: z.string().trim().min(1, t('paymentMethodRequired')),
  })
}
