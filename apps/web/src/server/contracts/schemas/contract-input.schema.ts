import { validationRefinement } from '@server/shared/http/validation-messages'
import '@server/openapi/zod-extend'
import { z } from 'zod'
import { contractDateSchema } from './contract-date.schema'
import { isValidPhone } from '@shared/schemas/phone-schema'
import { isValidCpf } from '@shared/schemas/cpf-schema'
import {
  adjustmentIndexSchema,
  contractGuaranteeTypeSchema,
  contractStatusSchema,
  contractTypeSchema,
} from './contract.schema'

const contractPartyInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    cpf: z.string().trim().min(1).refine(isValidCpf, validationRefinement('cpfInvalid')),
    email: z.string().trim().email().max(254),
    phone: z
      .string()
      .trim()
      .min(1)
      .refine(isValidPhone, validationRefinement('phoneInvalid'))
      .refine((value) => value.length <= 32, validationRefinement('stringMax', { maximum: 32 })),
  })
  .strict()

export const linkContractPartyUserRequestSchema = z
  .object({ email: z.string().trim().email().max(254) })
  .strict()
  .openapi('LinkContractPartyUserRequest')

export const contractAmountSchema = z.number().min(0.01).max(9999999999.99).multipleOf(0.01)

export const createContractRequestSchema = z
  .object({
    opportunityId: z.string().trim().min(1),
    amount: contractAmountSchema.optional(),
    type: contractTypeSchema,
    dueDay: z.number().int().min(1).max(31),
    startDate: contractDateSchema,
    endDate: contractDateSchema,
    adjustmentIndex: adjustmentIndexSchema,
    guaranteeType: contractGuaranteeTypeSchema,
    notes: z.string().trim().min(1).max(10000).nullable().optional(),
    owner: contractPartyInputSchema,
    tenant: contractPartyInputSchema,
    guarantor: contractPartyInputSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => value.endDate > value.startDate, {
    ...validationRefinement('endAfterStart'),
    path: ['endDate'],
  })
  .openapi('CreateContractRequest')

export const listContractsQuerySchema = z
  .object({
    status: contractStatusSchema.optional(),
    type: contractTypeSchema.optional(),
    propertyId: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).max(500).optional(),
    period: z.enum(['ALL', 'THIS_MONTH', 'NEXT_90_DAYS']).optional(),
    sortBy: z
      .enum(['property', 'tenant', 'amount', 'startDate', 'endDate', 'status', 'updatedAt'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    locale: z.enum(['pt-BR', 'en-US', 'es-ES']).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  })
  .strict()
  .openapi('ListContractsQuery')
