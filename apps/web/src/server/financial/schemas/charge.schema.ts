import '@server/openapi/zod-extend'
import { z } from 'zod'

export const chargeTypeSchema = z.enum(['A_RECEBER', 'A_PAGAR'])

export const chargeStatusSchema = z.enum(['PENDENTE', 'PAGA', 'ATRASADA', 'AGENDADA', 'CANCELADA'])

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
    receiptUrl: z.string().nullable(),
    paidAt: z.string().nullable(),
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

export const chargeIdParamsSchema = z.object({ id: z.string() }).openapi('ChargeIdParams')

export const chargeResponseSchema = z.object({ charge: chargeSchema }).openapi('ChargeResponse')

export const chargesResponseSchema = z
  .object({ items: z.array(chargeListItemSchema), totalCount: z.number() })
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
    monthlySeries: z.array(financialMonthlyTotalSchema),
    upcomingDues: z.array(financialUpcomingChargeSchema),
  })
  .openapi('FinancialSummary')
