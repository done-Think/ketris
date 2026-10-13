import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  createContractRequestSchema,
  listContractsQuerySchema,
} from './schemas/contract-input.schema'
import {
  contractIdParamsSchema,
  contractPartyIdParamsSchema,
  contractResponseSchema,
  contractsResponseSchema,
} from './schemas/contract.schema'

export function registerContractsOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/contracts',
    tags: ['Contracts'],
    summary: 'Lista contratos do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: { query: listContractsQuerySchema },
    responses: {
      200: {
        description: 'Lista de contratos do tenant.',
        content: { 'application/json': { schema: contractsResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/contracts',
    tags: ['Contracts'],
    summary: 'Cria contrato a partir de uma oportunidade aceita',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createContractRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Contrato criado.',
        content: { 'application/json': { schema: contractResponseSchema } },
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
        description: 'Oportunidade não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Oportunidade não aceita ou já tem contrato.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/contracts/{id}',
    tags: ['Contracts'],
    summary: 'Consulta contrato do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: { params: contractIdParamsSchema },
    responses: {
      200: {
        description: 'Contrato encontrado.',
        content: { 'application/json': { schema: contractResponseSchema } },
      },
      404: {
        description: 'Contrato não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/contracts/{id}/parties/{partyId}/sign',
    tags: ['Contracts'],
    summary: 'Registra a assinatura de uma parte do contrato',
    security: [{ bearerAuth: [] }],
    request: { params: contractPartyIdParamsSchema },
    responses: {
      200: {
        description: 'Assinatura registrada; contrato ativado se era a última assinatura pendente.',
        content: { 'application/json': { schema: contractResponseSchema } },
      },
      404: {
        description: 'Contrato ou parte não encontrados neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Esta parte já assinou o contrato.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
