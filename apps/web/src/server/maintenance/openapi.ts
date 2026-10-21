import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  addMaintenanceTicketNoteRequestSchema,
  createMaintenanceTicketRequestSchema,
  listMaintenanceTicketsQuerySchema,
  updateMaintenanceTicketRequestSchema,
  maintenanceActionSchema,
  maintenanceLinksSchema,
} from './schemas/maintenance-ticket-input.schema'
import {
  maintenanceActivitiesResponseSchema,
  maintenanceActivityResponseSchema,
  maintenanceTicketIdParamsSchema,
  maintenanceTicketResponseSchema,
  maintenanceTicketsResponseSchema,
  maintenanceOptionsSchema,
} from './schemas/maintenance-ticket.schema'

export function registerMaintenanceOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/maintenance/options',
    tags: ['Maintenance'],
    summary: 'Contratos permitidos e usuarios para administracao',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Opcoes limitadas ao usuario autenticado.',
        content: { 'application/json': { schema: maintenanceOptionsSchema } },
      },
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/maintenance/links',
    tags: ['Maintenance'],
    summary: 'Admin regulariza vinculos explicitos de proprietario e locatario',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: maintenanceLinksSchema } } } },
    responses: {
      204: { description: 'Vinculos regularizados e auditados.' },
      403: { description: 'Somente admin do tenant.' },
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/maintenance/tickets/{id}/actions',
    tags: ['Maintenance'],
    summary: 'Executa transicoes, atribuicoes, troca de prestador e restauracao autorizadas',
    description:
      'linkContract: somente ADMIN do tenant associa explicitamente o chamado a um contrato do mesmo imovel, inclusive encerrados e arquivados. Preserva status, data de resolucao, arquivamento e historico; registra contrato anterior/novo e autor na auditoria. Nenhum contrato e selecionado automaticamente. Arquivados continuam restritos ao ADMIN ate restauracao. confirm: ADMIN ou proprietario vinculado, desde que a conclusao nao tenha sido feita por OWNER. contest: ADMIN ou proprietario vinculado, com justificativa obrigatoria. Ambas exigem AGUARDANDO_CONFIRMACAO. AGENT e RENTER nao confirmam nem contestam.',
    security: [{ bearerAuth: [] }],
    request: {
      params: maintenanceTicketIdParamsSchema,
      body: { content: { 'application/json': { schema: maintenanceActionSchema } } },
    },
    responses: {
      200: {
        description: 'Acao e historico gravados juntos.',
        content: { 'application/json': { schema: maintenanceTicketResponseSchema } },
      },
      403: { description: 'Acao nao permitida.' },
      404: { description: 'Chamado fora do escopo.' },
      409: { description: 'Estado invalido ou alteracao concorrente.' },
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/maintenance/tickets',
    tags: ['Maintenance'],
    summary: 'Lista chamados de manutenção do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: { query: listMaintenanceTicketsQuerySchema },
    responses: {
      200: {
        description: 'Lista de chamados do tenant.',
        content: { 'application/json': { schema: maintenanceTicketsResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/maintenance/tickets',
    tags: ['Maintenance'],
    summary: 'Abre um novo chamado de manutenção para um imóvel do tenant',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createMaintenanceTicketRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Chamado criado.',
        content: { 'application/json': { schema: maintenanceTicketResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Imóvel não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/maintenance/tickets/{id}',
    tags: ['Maintenance'],
    summary: 'Consulta um chamado de manutenção do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: { params: maintenanceTicketIdParamsSchema },
    responses: {
      200: {
        description: 'Chamado encontrado.',
        content: { 'application/json': { schema: maintenanceTicketResponseSchema } },
      },
      404: {
        description: 'Chamado não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/maintenance/tickets/{id}',
    tags: ['Maintenance'],
    summary: 'Atualiza dados de um chamado de manutenção',
    security: [{ bearerAuth: [] }],
    request: {
      params: maintenanceTicketIdParamsSchema,
      body: { content: { 'application/json': { schema: updateMaintenanceTicketRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Chamado atualizado.',
        content: { 'application/json': { schema: maintenanceTicketResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Chamado ou imóvel não encontrados neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/maintenance/tickets/{id}',
    tags: ['Maintenance'],
    summary: 'Exclui um chamado de manutenção',
    security: [{ bearerAuth: [] }],
    request: { params: maintenanceTicketIdParamsSchema },
    responses: {
      204: { description: 'Chamado arquivado sem remover dados; somente admin.' },
      404: {
        description: 'Chamado não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/maintenance/tickets/{id}/resolve',
    tags: ['Maintenance'],
    summary: 'Conclui atendimento e solicita confirmacao da resolucao',
    security: [{ bearerAuth: [] }],
    request: { params: maintenanceTicketIdParamsSchema },
    responses: {
      200: {
        description: 'Chamado aguardando confirmacao.',
        content: { 'application/json': { schema: maintenanceTicketResponseSchema } },
      },
      404: {
        description: 'Chamado não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Chamado já está resolvido ou fechado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/maintenance/tickets/{id}/notes',
    tags: ['Maintenance'],
    summary: 'Adiciona uma mensagem/nota à linha do tempo do chamado',
    security: [{ bearerAuth: [] }],
    request: {
      params: maintenanceTicketIdParamsSchema,
      body: { content: { 'application/json': { schema: addMaintenanceTicketNoteRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Nota registrada.',
        content: { 'application/json': { schema: maintenanceActivityResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Chamado não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/maintenance/tickets/{id}/activities',
    tags: ['Maintenance'],
    summary: 'Lista a linha do tempo de um chamado de manutenção',
    security: [{ bearerAuth: [] }],
    request: { params: maintenanceTicketIdParamsSchema },
    responses: {
      200: {
        description: 'Linha do tempo do chamado.',
        content: { 'application/json': { schema: maintenanceActivitiesResponseSchema } },
      },
      404: {
        description: 'Chamado não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
