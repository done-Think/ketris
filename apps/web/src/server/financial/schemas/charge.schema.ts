import '@server/openapi/zod-extend'
import { z } from 'zod'

export const chargeTypeSchema = z.enum(['A_RECEBER', 'A_PAGAR'])

export const chargeStatusSchema = z
  .enum(['PENDENTE', 'PAGA', 'ATRASADA', 'AGENDADA', 'CANCELADA'])
  .openapi({
    description:
      'ATRASADA não é gravada: é calculada para PENDENTE ou AGENDADA com vencimento antes de hoje (America/Sao_Paulo).',
  })

export const storedChargeStatusSchema = z.enum(['PENDENTE', 'PAGA', 'AGENDADA', 'CANCELADA'])

export const chargeReceiptSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    contentType: z.string(),
    size: z.number().int(),
    uploadedAt: z.string(),
  })
  .openapi('ChargeReceipt')

export const newChargeStatusSchema = z.enum(['PENDENTE', 'AGENDADA'])

export const chargeSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    type: chargeTypeSchema,
    status: chargeStatusSchema,
    amount: z.number(),
    dueDate: z.string(),
    description: z.string().nullable(),
    paymentMethod: z.string().nullable(),
    paidAt: z.string().nullable(),
    cancelledAt: z.string().nullable(),
    cancellationReason: z.string().nullable(),
    receipt: chargeReceiptSchema.nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    contractId: z.string().nullable(),
    contractCode: z.string().nullable(),
    propertyId: z.string().nullable(),
    propertyTitle: z.string().nullable(),
    propertyAddress: z.string().nullable(),
    payerName: z.string().nullable(),
    payerEmail: z.string().nullable(),
  })
  .openapi('Charge')

export const chargeListItemSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    type: chargeTypeSchema,
    status: chargeStatusSchema,
    amount: z.number(),
    dueDate: z.string(),
    description: z.string().nullable(),
    contractId: z.string().nullable(),
    payerName: z.string().nullable(),
    propertyTitle: z.string().nullable(),
    updatedAt: z.string(),
  })
  .openapi('ChargeListItem')

export const chargeIdParamsSchema = z
  .object({ id: z.string().trim().min(1).max(64) })
  .strict()
  .openapi('ChargeIdParams')

export const chargeReceiptParamsSchema = z
  .object({ id: z.string().trim().min(1).max(64), receiptId: z.string().trim().min(1).max(64) })
  .strict()
  .openapi('ChargeReceiptParams')

export const chargeAuditEventSchema = z
  .object({
    id: z.string(),
    action: z.enum([
      'CREATED',
      'UPDATED',
      'PAYMENT_REGISTERED',
      'PAYMENT_REVERSED',
      'CANCELLED',
      'DELETED',
    ]),
    actorType: z.enum(['USER', 'SYSTEM']),
    actorName: z.string().nullable(),
    changedFields: z.array(z.string()),
    fromStatus: storedChargeStatusSchema.nullable(),
    toStatus: storedChargeStatusSchema.nullable(),
    reason: z.string().nullable(),
    receipt: chargeReceiptSchema.nullable(),
    createdAt: z.string(),
  })
  .openapi('ChargeAuditEvent')

export const chargeHistoryResponseSchema = z
  .object({ events: z.array(chargeAuditEventSchema) })
  .openapi('ChargeHistoryResponse')

export const chargeReceiptUploadResponseSchema = z
  .object({
    uploadUrl: z.string(),
    headers: z.record(z.string()),
    uploadToken: z.string(),
    expiresAt: z.string(),
  })
  .openapi('ChargeReceiptUploadResponse')

export const chargeReceiptDownloadResponseSchema = z
  .object({ url: z.string(), expiresAt: z.string() })
  .openapi('ChargeReceiptDownloadResponse')

export const chargeResponseSchema = z.object({ charge: chargeSchema }).openapi('ChargeResponse')

export const chargeStatusCountsSchema = z
  .object({
    ALL: z.number().int(),
    PENDENTE: z.number().int(),
    ATRASADA: z.number().int(),
    PAGA: z.number().int(),
    AGENDADA: z.number().int(),
    CANCELADA: z.number().int(),
  })
  .openapi('ChargeStatusCounts', {
    description: 'Contagem por status com os mesmos filtros da lista, exceto o próprio status.',
  })

export const chargesResponseSchema = z
  .object({
    items: z.array(chargeListItemSchema),
    totalCount: z.number(),
    statusCounts: chargeStatusCountsSchema,
  })
  .openapi('ChargesResponse')

export const financialMonthlyTotalSchema = z
  .object({ year: z.number().int(), month: z.number().int(), total: z.number() })
  .openapi('FinancialMonthlyTotal')

export const financialUpcomingChargeSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    description: z.string().nullable(),
    payerName: z.string().nullable(),
    propertyId: z.string().nullable(),
    propertyTitle: z.string().nullable(),
    dueDate: z.string(),
    amount: z.number(),
    status: chargeStatusSchema,
  })
  .openapi('FinancialUpcomingCharge')

export const financialSummarySchema = z
  .object({
    monthlyReceivable: z.number(),
    overdueTotal: z.number(),
    defaultRatePercentage: z.number(),
    occupancyRatePercentage: z.number(),
    monthlySeries: z.array(financialMonthlyTotalSchema),
    upcomingDues: z.array(financialUpcomingChargeSchema),
  })
  .openapi('FinancialSummary')
