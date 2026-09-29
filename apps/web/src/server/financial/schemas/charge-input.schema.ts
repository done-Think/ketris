import '@server/openapi/zod-extend'
import { z } from 'zod'

import { chargeStatusSchema, chargeTypeSchema, newChargeStatusSchema } from './charge.schema'

export const createChargeRequestSchema = z
  .object({
    contractId: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    type: chargeTypeSchema,
    amount: z.coerce.number().positive(),
    dueDate: z.coerce.date(),
    status: newChargeStatusSchema,
  })
  .refine((value) => Boolean(value.contractId) || Boolean(value.description), {
    message: 'Informe uma descrição para uma cobrança avulsa (sem contrato).',
    path: ['description'],
  })
  .openapi('CreateChargeRequest')

export const updateChargeRequestSchema = z
  .object({
    description: z.string().trim().min(1).nullable().optional(),
    type: chargeTypeSchema,
    amount: z.coerce.number().positive(),
    dueDate: z.coerce.date(),
    status: chargeStatusSchema,
  })
  .openapi('UpdateChargeRequest')

export const registerChargePaymentRequestSchema = z
  .object({
    paidAt: z.coerce.date(),
    paymentMethod: z.string().trim().min(1),
    receiptUrl: z.string().trim().url().nullable().optional(),
  })
  .openapi('RegisterChargePaymentRequest')

export const listChargesQuerySchema = z
  .object({
    type: chargeTypeSchema.optional(),
    status: chargeStatusSchema.optional(),
    search: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  })
  .openapi('ListChargesQuery')

export type CreateChargeRequestDTO = z.infer<typeof createChargeRequestSchema>
export type UpdateChargeRequestDTO = z.infer<typeof updateChargeRequestSchema>
export type RegisterChargePaymentRequestDTO = z.infer<typeof registerChargePaymentRequestSchema>
export type ListChargesQueryDTO = z.infer<typeof listChargesQuerySchema>
