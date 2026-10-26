import '@server/openapi/zod-extend'
import { z } from 'zod'

import { opportunityActivitySchema } from './activity.schema'
import { opportunitySchema } from './opportunity.schema'

export const opportunityResponseActionSchema = z
  .enum(['ACEITAR', 'RECUSAR', 'SOLICITAR_INFORMACOES'])
  .openapi('OpportunityResponseAction')

export const respondOpportunityRequestSchema = z
  .object({
    action: opportunityResponseActionSchema,
    message: z
      .string()
      .min(1)
      .max(2000)
      .nullable()
      .optional()
      .openapi({
        description:
          'Justificativa da recusa ou o que está sendo solicitado ao interessado. Vira a nota ' +
          'registrada na timeline; quando ausente, uma descrição padrão da ação é usada.',
      }),
  })
  .strict()
  .openapi('RespondOpportunityRequest')

export const respondOpportunityResponseSchema = z
  .object({
    opportunity: opportunitySchema,
    activity: opportunityActivitySchema,
  })
  .openapi('RespondOpportunityResponse')
