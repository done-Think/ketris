import '@server/openapi/zod-extend'
import { z } from 'zod'
import { INTERACTION_NOTE_LIMIT } from '../constants/interactions'
import { crmDateSchema, crmNullableTimestampSchema } from './crm-date.schema'
import { crmListQuerySchema, crmPaginationSchema } from './pagination.schema'

export const interactionChannelSchema = z
  .enum(['PHONE', 'EMAIL', 'WHATSAPP'])
  .openapi('CrmInteractionChannel')
export const interactionStatusSchema = z
  .enum(['STARTED', 'CONTACT_MADE', 'NO_RESPONSE', 'CANCELLED'])
  .openapi('CrmInteractionStatus')
export const crmInteractionSchema = z
  .object({
    id: z.string(),
    kind: z.enum(['CONTACT_ATTEMPT', 'STAGE_CHANGED', 'CONTACT_LINKED', 'LEAD_CREATED']).optional(),
    contactId: z.string().nullable().optional(),
    previousStage: z
      .enum(['NEW', 'IN_CONTACT', 'VISIT_SCHEDULED', 'PROPOSAL'])
      .nullable()
      .optional(),
    nextStage: z.enum(['NEW', 'IN_CONTACT', 'VISIT_SCHEDULED', 'PROPOSAL']).nullable().optional(),
    leadId: z.string().nullable(),
    leadName: z.string().nullable(),
    opportunityId: z.string().nullable(),
    channel: interactionChannelSchema.nullable(),
    status: interactionStatusSchema.nullable(),
    description: z.string().nullable(),
    actorUserId: z.string(),
    actorName: z.string(),
    completedById: z.string().nullable(),
    createdAt: crmDateSchema,
    completedAt: crmNullableTimestampSchema,
    canComplete: z.boolean(),
  })
  .openapi('CrmInteraction')
export const startInteractionSchema = z
  .object({ channel: interactionChannelSchema, requestId: z.string().uuid() })
  .strict()
  .openapi('StartCrmInteractionRequest')
export const completeInteractionSchema = z
  .object({
    status: z.enum(['CONTACT_MADE', 'NO_RESPONSE', 'CANCELLED']),
    description: z.string().trim().max(INTERACTION_NOTE_LIMIT).optional(),
  })
  .strict()
  .openapi('CompleteCrmInteractionRequest')
export const interactionQuerySchema = crmListQuerySchema
  .pick({ page: true, pageSize: true })
  .strict()
export const interactionResponseSchema = z
  .object({ interaction: crmInteractionSchema })
  .openapi('CrmInteractionResponse')
export const interactionPageSchema = z
  .object({ interactions: z.array(crmInteractionSchema), pagination: crmPaginationSchema })
  .openapi('CrmInteractionsPage')
