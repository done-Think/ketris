import '@server/openapi/zod-extend'
import { z } from 'zod'

import { CHARGE_RECEIPT_CONTENT_TYPES, CHARGE_RECEIPT_MAX_BYTES } from '../config/receipt-limits'

export const initChargeReceiptUploadRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .refine((name) => !/[\r\n\0]/.test(name), 'Nome de arquivo inválido.'),
    contentType: z.enum(CHARGE_RECEIPT_CONTENT_TYPES),
    size: z.number().int().positive().max(CHARGE_RECEIPT_MAX_BYTES),
    sha256: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-f0-9]{64}$/),
  })
  .strict()
  .openapi('InitChargeReceiptUploadRequest')

export const chargeReceiptDescriptorSchema = initChargeReceiptUploadRequestSchema
  .extend({
    id: z.string().min(1),
    tenantId: z.string().min(1),
    chargeId: z.string().min(1),
    actorId: z.string().min(1),
  })
  .strict()
