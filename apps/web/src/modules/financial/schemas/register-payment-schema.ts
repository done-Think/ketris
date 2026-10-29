import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

import { RECEIPT_CONTENT_TYPES, RECEIPT_MAX_BYTES } from '../config/receipt-limits'
import { createChargeDateSchema } from './charge-date-schema'

export function createRegisterPaymentSchema(
  t: SchemaMessageTranslator<
    'dateInvalid' | 'paymentMethodRequired' | 'paymentMethodTooLong' | 'receiptSize' | 'receiptType'
  >,
) {
  return z.object({
    paymentDate: createChargeDateSchema(t),
    paymentMethod: z
      .string()
      .trim()
      .min(1, t('paymentMethodRequired'))
      .max(100, t('paymentMethodTooLong')),
    receipt: z
      .custom<File | null>((value) => value === null || value instanceof File)
      .refine((file) => !file || RECEIPT_CONTENT_TYPES.includes(file.type), t('receiptType'))
      .refine((file) => !file || file.size <= RECEIPT_MAX_BYTES, t('receiptSize')),
  })
}
