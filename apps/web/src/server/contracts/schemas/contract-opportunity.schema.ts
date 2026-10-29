import '@server/openapi/zod-extend'
import { z } from 'zod'

export const listContractOpportunitiesQuerySchema = z
  .object({
    search: z.string().trim().max(500).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict()
  .openapi('ListContractOpportunitiesQuery')

export const contractOpportunitySchema = z
  .object({
    id: z.string(),
    leadName: z.string(),
    leadEmail: z.string(),
    leadPhone: z.string().nullable(),
    propertyId: z.string(),
    propertyTitle: z.string(),
    propertyAddress: z.string(),
    proposedValue: z.number(),
    owner: z
      .object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        phone: z.string().nullable(),
      })
      .nullable(),
  })
  .openapi('ContractOpportunity')

export const contractOpportunitiesResponseSchema = z
  .object({
    items: z.array(contractOpportunitySchema),
    totalCount: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  })
  .openapi('ContractOpportunitiesResponse')
