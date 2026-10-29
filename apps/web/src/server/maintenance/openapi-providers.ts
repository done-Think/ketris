import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import {
  createMaintenanceProviderRequestSchema,
  listMaintenanceProvidersQuerySchema,
  maintenanceProviderResponseSchema,
  maintenanceProvidersResponseSchema,
  updateMaintenanceProviderRequestSchema,
} from './schemas/maintenance-provider.schema'
import { maintenanceTicketIdParamsSchema } from './schemas/maintenance-ticket.schema'

export function registerMaintenanceProvidersOpenApi(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'get',
    path: '/maintenance/providers',
    tags: ['Maintenance'],
    summary: 'Lista prestadores autorizados da imobiliária',
    description:
      'Gestão consulta o catálogo do próprio tenant. Outros usuários precisam informar um chamado no qual já podem atribuir prestador; o catálogo pertence ao tenant do chamado, inclusive para RENTER de tenant compartilhado. Prestadores inativos só aparecem para a gestão quando solicitado.',
    security: [{ bearerAuth: [] }],
    request: { query: listMaintenanceProvidersQuerySchema },
    responses: {
      200: {
        description: 'Página do catálogo autorizado.',
        content: { 'application/json': { schema: maintenanceProvidersResponseSchema } },
      },
      403: { description: 'Catálogo não permitido.' },
      404: { description: 'Chamado fora do escopo.' },
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/maintenance/providers',
    tags: ['Maintenance'],
    summary: 'Cadastra ou reutiliza prestador com os mesmos dados no tenant autorizado',
    description:
      'Quem já pode atribuir prestador pode cadastrar no catálogo do tenant do chamado. Gestão também pode cadastrar sem chamado. Cadastros idênticos são reutilizados; inativos exigem reativação pela gestão. Não altera snapshots de chamados existentes.',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createMaintenanceProviderRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Prestador cadastrado ou reutilizado.',
        content: { 'application/json': { schema: maintenanceProviderResponseSchema } },
      },
      400: { description: 'Dados inválidos.' },
      403: { description: 'Cadastro não permitido.' },
      404: { description: 'Chamado fora do escopo.' },
      409: { description: 'Prestador idêntico está inativo.' },
    },
  })
  registry.registerPath({
    method: 'patch',
    path: '/maintenance/providers/{id}',
    tags: ['Maintenance'],
    summary: 'Gestão edita, inativa ou reativa um prestador do próprio tenant',
    description:
      'Registra autor, data e campos alterados na mesma transação. Mantém os dados já registrados em chamados e atividades. Prestadores inativos ficam indisponíveis para novas atribuições.',
    security: [{ bearerAuth: [] }],
    request: {
      params: maintenanceTicketIdParamsSchema,
      body: { content: { 'application/json': { schema: updateMaintenanceProviderRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Prestador atualizado e auditado.',
        content: { 'application/json': { schema: maintenanceProviderResponseSchema } },
      },
      400: { description: 'Dados inválidos.' },
      403: { description: 'Somente gestão.' },
      404: { description: 'Prestador fora do escopo.' },
      409: { description: 'Dados duplicados ou alteração concorrente.' },
    },
  })
}
