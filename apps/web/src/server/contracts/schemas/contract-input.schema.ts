import '@server/openapi/zod-extend'
import { z } from 'zod'

import {
  adjustmentIndexSchema,
  contractGuaranteeTypeSchema,
  contractStatusSchema,
  contractTypeSchema,
} from './contract.schema'

const contractPartyInputSchema = z.object({
  name: z.string().trim().min(1),
  cpf: z.string().trim().min(11),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).nullable().optional(),
})

export const createContractRequestSchema = z
  .object({
    opportunityId: z.string().trim().min(1),
    type: contractTypeSchema,
    dueDay: z.number().int().min(1).max(31),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    adjustmentIndex: adjustmentIndexSchema,
    guaranteeType: contractGuaranteeTypeSchema,
    notes: z.string().trim().min(1).nullable().optional(),
    owner: contractPartyInputSchema,
    tenant: contractPartyInputSchema,
    guarantor: contractPartyInputSchema.nullable().optional(),
  })
  .refine((value) => value.endDate > value.startDate, {
    message: 'A data de término deve ser posterior à data de início.',
    path: ['endDate'],
  })
  .openapi('CreateContractRequest')

export const listContractsQuerySchema = z
  .object({
    status: contractStatusSchema.optional(),
    type: contractTypeSchema.optional(),
    propertyId: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  })
  .openapi('ListContractsQuery')

export type CreateContractRequestDTO = z.infer<typeof createContractRequestSchema>
export type ListContractsQueryDTO = z.infer<typeof listContractsQuerySchema>
