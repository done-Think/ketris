import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  createChargeRequestSchema,
  listChargesQuerySchema,
  registerChargePaymentRequestSchema,
  updateChargeRequestSchema,
} from './schemas/charge-input.schema'
import {
  chargeIdParamsSchema,
  chargeResponseSchema,
  chargesResponseSchema,
  financialSummarySchema,
} from './schemas/charge.schema'

export function registerFinancialOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/financial/charges',
    tags: ['Financial'],
    summary: 'Lista cobranças do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: { query: listChargesQuerySchema },
    responses: {
      200: {
        description: 'Lista de cobranças do tenant.',
        content: { 'application/json': { schema: chargesResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/financial/charges',
    tags: ['Financial'],
    summary: 'Cria uma cobrança (avulsa ou vinculada a um contrato)',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createChargeRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Cobrança criada.',
        content: { 'application/json': { schema: chargeResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Ator sem permissão para gerenciar cobranças.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Contrato não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/financial/charges/{id}',
    tags: ['Financial'],
    summary: 'Consulta cobrança do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: { params: chargeIdParamsSchema },
    responses: {
      200: {
        description: 'Cobrança encontrada.',
        content: { 'application/json': { schema: chargeResponseSchema } },
      },
      404: {
        description: 'Cobrança não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/financial/charges/{id}',
    tags: ['Financial'],
    summary: 'Edita uma cobrança (não altera o pagamento por aqui)',
    security: [{ bearerAuth: [] }],
    request: {
      params: chargeIdParamsSchema,
      body: { content: { 'application/json': { schema: updateChargeRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Cobrança atualizada.',
        content: { 'application/json': { schema: chargeResponseSchema } },
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
        description: 'Cobrança não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/financial/charges/{id}/payment',
    tags: ['Financial'],
    summary: 'Registra o pagamento de uma cobrança',
    security: [{ bearerAuth: [] }],
    request: {
      params: chargeIdParamsSchema,
      body: { content: { 'application/json': { schema: registerChargePaymentRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Pagamento registrado; cobrança marcada como paga.',
        content: { 'application/json': { schema: chargeResponseSchema } },
      },
      404: {
        description: 'Cobrança não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Cobrança já paga ou cancelada.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/financial/summary',
    tags: ['Financial'],
    summary: 'Agregação financeira do tenant para o dashboard',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Resumo financeiro do tenant.',
        content: { 'application/json': { schema: financialSummarySchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
