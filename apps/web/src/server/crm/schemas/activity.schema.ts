import { crmDateSchema } from './crm-date.schema'
import '@server/openapi/zod-extend'
import { z } from 'zod'

import { opportunityStatusSchema } from './opportunity.schema'

export const activityTypeSchema = z
  .enum(['NOTE', 'STATUS_CHANGE', 'CONTACT_MADE', 'PROPOSAL_ANSWERED'])
  .openapi('OpportunityActivityType')

export const opportunityActivitySchema = z
  .object({
    id: z.string(),
    opportunityId: z.string(),
    type: activityTypeSchema,
    description: z.string(),
    systemAction: z.string().nullable(),
    authorId: z.string().nullable(),
    authorName: z.string().nullable(),
    previousStatus: opportunityStatusSchema.nullable(),
    newStatus: opportunityStatusSchema.nullable(),
    createdAt: crmDateSchema,
  })
  .openapi('OpportunityActivity')

export const listActivitiesResponseSchema = z
  .object({ activities: z.array(opportunityActivitySchema) })
  .openapi('ListOpportunityActivitiesResponse')

export const createActivityRequestSchema = z
  .object({
    description: z.string().min(1).max(2000),
    type: z.enum(['NOTE', 'CONTACT_MADE']).optional(),
  })
  .strict()
  .openapi('CreateOpportunityActivityRequest')

export const activityResponseSchema = z
  .object({ activity: opportunityActivitySchema })
  .openapi('OpportunityActivityResponse')
