import { linkLeadContactSchema } from './schemas/lead-contact.schema'
import { leadResponseSchema } from './schemas/lead.schema'
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import {
  interactionPageSchema,
  interactionQuerySchema,
  interactionResponseSchema,
  startInteractionSchema,
  completeInteractionSchema,
} from './schemas/interaction.schema'
import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

export function registerInteractionOpenApi(registry: OpenAPIRegistry) {
  const json = (schema: z.ZodTypeAny) => ({ content: { 'application/json': { schema } } })
  const error = (description: string) => ({ description, ...json(errorResponseSchema) })
  const common = {
    tags: ['CRM'],
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ id: z.string() }) },
  }
  for (const target of ['leads', 'contacts', 'opportunities']) {
    registry.registerPath({
      ...common,
      method: 'get',
      path: `/crm/${target}/{id}/interactions`,
      summary: 'Lists authorized lead contact attempts and outcomes',
      request: { ...common.request, query: interactionQuerySchema },
      responses: {
        200: { description: 'Paginated interaction history.', ...json(interactionPageSchema) },
        400: error('Invalid pagination.'),
        401: error('Authentication required.'),
        403: error('CRM access required.'),
        404: error('Record not found.'),
      },
    })
  }
  for (const resource of ['leads', 'contacts'])
    registry.registerPath({
      ...common,
      method: 'post',
      path: `/crm/${resource}/{id}/interactions`,
      summary: 'Records a contact shortcut attempt without confirming contact',
      request: { ...common.request, body: json(startInteractionSchema) },
      responses: {
        200: {
          description: 'Created or replayed idempotent attempt.',
          ...json(interactionResponseSchema),
        },
        400: error('Invalid input.'),
        401: error('Authentication required.'),
        403: error('CRM access required.'),
        404: error('Lead not found.'),
        409: error('Request identifier conflict.'),
        422: error('Contact channel unavailable.'),
      },
    })
  registry.registerPath({
    ...common,
    method: 'patch',
    path: '/crm/interactions/{id}',
    summary: 'Confirms the outcome of a pending contact attempt',
    request: { ...common.request, body: json(completeInteractionSchema) },
    responses: {
      200: { description: 'Recorded outcome.', ...json(interactionResponseSchema) },
      400: error('Invalid input.'),
      401: error('Authentication required.'),
      403: error('Actor cannot complete this attempt.'),
      404: error('Attempt not found.'),
      409: error('Outcome already recorded.'),
    },
  })
  registry.registerPath({
    ...common,
    method: 'post',
    path: '/crm/leads/{id}/contact',
    summary: 'Links a lead to an authorized contact or creates a contact explicitly',
    request: { ...common.request, body: json(linkLeadContactSchema) },
    responses: {
      200: { description: 'Linked lead.', ...json(leadResponseSchema) },
      400: error('Invalid contact.'),
      401: error('Authentication required.'),
      403: error('CRM access required.'),
      404: error('Lead or contact not found.'),
      409: error('Conflicting link or duplicate contact email.'),
    },
  })
}
