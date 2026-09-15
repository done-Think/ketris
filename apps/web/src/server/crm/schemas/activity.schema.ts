import '@server/openapi/zod-extend'
import { z } from 'zod'

import { opportunityStatusSchema } from './opportunity.schema'

export const activityTypeSchema = z
  .enum(['NOTA', 'MUDANCA_STATUS', 'CONTATO_REALIZADO', 'PROPOSTA_RESPONDIDA'])
  .openapi('OpportunityActivityType')

export const opportunityActivitySchema = z
  .object({
    id: z.string(),
    opportunityId: z.string(),
    type: activityTypeSchema,
    description: z.string(),
    authorId: z.string().nullable(),
    authorName: z.string().nullable(),
    previousStatus: opportunityStatusSchema.nullable(),
    newStatus: opportunityStatusSchema.nullable(),
    createdAt: z.coerce.date(),
  })
  .openapi('OpportunityActivity')

export const listActivitiesResponseSchema = z
  .object({ activities: z.array(opportunityActivitySchema) })
  .openapi('ListOpportunityActivitiesResponse')

export const createActivityRequestSchema = z
  .object({
    description: z.string().min(1, 'Descrição é obrigatória.').max(2000),
    type: z.enum(['NOTA', 'CONTATO_REALIZADO']).optional(),
  })
  .openapi('CreateOpportunityActivityRequest')

export const activityResponseSchema = z
  .object({ activity: opportunityActivitySchema })
  .openapi('OpportunityActivityResponse')

export type CreateActivityRequestDTO = z.infer<typeof createActivityRequestSchema>
