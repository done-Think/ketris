import { validationRefinement } from '@server/shared/http/validation-messages'
import '@server/openapi/zod-extend'
import { z } from 'zod'
import { createContractRequestSchema, contractAmountSchema } from './contract-input.schema'
import { contractActorSchema, contractStatusSchema } from './contract.schema'

export const editContractRequestSchema = createContractRequestSchema
  .innerType()
  .omit({ opportunityId: true })
  .extend({ amount: contractAmountSchema })
  .strict()
  .refine((value) => value.endDate > value.startDate, {
    ...validationRefinement('endAfterStart'),
    path: ['endDate'],
  })
  .openapi('EditContractRequest')

export const transitionContractRequestSchema = z
  .object({ reason: z.string().trim().min(1).max(10000) })
  .strict()
  .openapi('TransitionContractRequest')
export const signContractPartyRequestSchema = z
  .object({ documentId: z.string().trim().min(1) })
  .strict()
  .openapi('SignContractPartyRequest')
export const contractHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict()
  .openapi('ContractHistoryQuery')
export const contractHistoryEntrySchema = z
  .object({
    id: z.string(),
    action: z.enum([
      'CREATED',
      'UPDATED',
      'MANUAL_SIGNATURE_REGISTERED',
      'DOCUMENT_UPLOADED',
      'CANCELLED',
      'CLOSED',
    ]),
    actor: contractActorSchema.nullable(),
    actorType: z.enum(['USER', 'SYSTEM']),
    changedFields: z.array(z.string()),
    fromStatus: contractStatusSchema.nullable(),
    toStatus: contractStatusSchema.nullable(),
    reason: z.string().nullable(),
    documentId: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi('ContractHistoryEntry')
export const contractHistoryResponseSchema = z
  .object({
    items: z.array(contractHistoryEntrySchema),
    totalCount: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  })
  .openapi('ContractHistoryResponse')
