import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'
import { propertyIdParamsSchema } from './schemas/property.schema'
import {
  propertyHistoryPageSchema,
  propertyHistoryResponseSchema,
  propertyHistoryParamsSchema,
  propertyHistoryQuerySchema,
  propertyHistoryNonNullValueSchema,
} from './schemas/property-history.schema'

export function registerPropertyHistoryOpenApi(registry: OpenAPIRegistry) {
  registry.register('PropertyHistoryNonNullValue', propertyHistoryNonNullValueSchema)
  for (const detail of [false, true]) {
    registry.registerPath({
      method: 'get',
      path: detail ? '/properties/{id}/history/{eventId}' : '/properties/{id}/history',
      tags: ['Properties'],
      summary: detail
        ? 'Reads one authorized property audit event'
        : 'Lists authorized property audit history',
      security: [{ bearerAuth: [] }],
      request: detail
        ? { params: propertyHistoryParamsSchema }
        : { params: propertyIdParamsSchema, query: propertyHistoryQuerySchema },
      responses: {
        200: {
          description: 'Property audit history.',
          content: {
            'application/json': {
              schema: detail ? propertyHistoryResponseSchema : propertyHistoryPageSchema,
            },
          },
        },
        401: {
          description: 'Authentication required.',
          content: { 'application/json': { schema: errorResponseSchema } },
        },
        403: {
          description: 'Property audit history unavailable for this role.',
          content: { 'application/json': { schema: errorResponseSchema } },
        },
        404: {
          description: 'Property or event not found in the authorized scope.',
          content: { 'application/json': { schema: errorResponseSchema } },
        },
      },
    })
  }
}
