import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import { agencyOverviewResponseSchema } from './schemas/agency-overview.schema'

export function registerAgencyDashboardOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/agency-dashboard/overview',
    tags: ['Agency Dashboard'],
    summary: 'Visão geral consolidada da agência (tenant), restrita a OWNER/ADMIN',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Visão geral da agência para o tenant autenticado.',
        content: { 'application/json': { schema: agencyOverviewResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Ator sem permissão para ver a visão geral da agência.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
