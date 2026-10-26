import '@server/openapi/zod-extend'
import { z } from 'zod'

import { chargeStatusSchema, chargeTypeSchema, newChargeStatusSchema } from './charge.schema'

const descriptionSchema = z.string().trim().min(1).max(500)
const amountSchema = z.coerce.number().positive().max(9999999999.99)
const dateSchema = z.coerce.date()
const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .transform((value) => ({ year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)) - 1 }))
  .openapi({ type: 'string', example: '2026-10', description: 'Mês no formato AAAA-MM.' })

export const createChargeRequestSchema = z
  .object({
    contractId: z.string().trim().min(1).max(64).optional(),
    description: descriptionSchema.optional(),
    type: chargeTypeSchema,
    amount: amountSchema,
    dueDate: dateSchema,
    status: newChargeStatusSchema,
  })
  .strict()
  .refine((value) => Boolean(value.contractId) || Boolean(value.description), {
    message: 'Informe uma descrição para uma cobrança avulsa (sem contrato).',
    path: ['description'],
  })
  .openapi('CreateChargeRequest')

export const updateChargeRequestSchema = z
  .object({
    description: descriptionSchema.nullable().optional(),
    type: chargeTypeSchema.optional(),
    amount: amountSchema.optional(),
    dueDate: dateSchema.optional(),
  })
  .strict()
  .openapi('UpdateChargeRequest', {
    description:
      'Não troca status. Cobrança paga ou cancelada só aceita mudança de descrição (409 CHARGE_LOCKED).',
  })

export const registerChargePaymentRequestSchema = z
  .object({
    paidAt: dateSchema,
    paymentMethod: z.string().trim().min(1).max(100),
    receiptUploadToken: z.string().min(1).max(8000).optional(),
  })
  .strict()
  .openapi('RegisterChargePaymentRequest')

export const chargeReasonRequestSchema = z
  .object({ reason: z.string().trim().min(3).max(500) })
  .strict()
  .openapi('ChargeReasonRequest')

export const listChargesQuerySchema = z
  .object({
    type: chargeTypeSchema.optional(),
    status: chargeStatusSchema.optional(),
    search: z.string().trim().min(1).max(200).optional(),
    dueMonth: monthSchema.optional(),
    page: z.coerce.number().int().positive().max(1000000).optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  })
  .strict()
  .openapi('ListChargesQuery')

export const financialSummaryQuerySchema = z
  .object({ month: monthSchema.optional() })
  .strict()
  .openapi('FinancialSummaryQuery')

export const exportChargesQuerySchema = z
  .object({ month: monthSchema, locale: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR') })
  .strict()
  .openapi('ExportChargesQuery')
