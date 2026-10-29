import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import { dashboardOverviewResponseSchema } from './schemas/dashboard-overview.schema'

export function registerDashboardOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/dashboard/overview',
    tags: ['Dashboard'],
    summary: 'Números e listas do dashboard do usuário (OWNER vê a imobiliária, AGENT o próprio)',
    description:
      'Agrega no servidor os KPIs operacionais (leads ativos, visitas, propostas), os 5 leads ' +
      'mais recentes e as 5 próximas atividades. "Hoje" e "mês" seguem o fuso America/Sao_Paulo.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Dados do dashboard para o usuário autenticado.',
        content: { 'application/json': { schema: dashboardOverviewResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Papel sem acesso ao dashboard (só OWNER e AGENT).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
