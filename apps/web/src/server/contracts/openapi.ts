import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  createContractRequestSchema,
  listContractsQuerySchema,
  linkContractPartyUserRequestSchema,
} from './schemas/contract-input.schema'
import {
  contractIdParamsSchema,
  contractPartyIdParamsSchema,
  contractResponseSchema,
  contractPartyUserLinkSchema,
  contractsResponseSchema,
} from './schemas/contract.schema'

export function registerContractsOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'post',
    path: '/contracts/{id}/parties/{partyId}/link-user',
    tags: ['Contracts'],
    summary: 'Administrador confirma o vínculo de um locatário pelo e-mail da parte',
    description:
      'Somente ADMIN do tenant do contrato. Localiza uma conta RENTER ativa pelo e-mail da parte LOCATARIO e persiste seu ID. Não substitui vínculo com outro usuário. A conta pode pertencer ao tenant compartilhado de locatários.',
    security: [{ bearerAuth: [] }],
    request: {
      params: contractPartyIdParamsSchema,
      body: { content: { 'application/json': { schema: linkContractPartyUserRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Vínculo confirmado, inclusive quando já existe para o mesmo usuário.',
        content: { 'application/json': { schema: contractPartyUserLinkSchema } },
      },
      400: {
        description: 'E-mail inválido ou campos não permitidos.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Somente administradores podem confirmar o vínculo.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description:
          'Contrato ou parte locatária não encontrados no tenant, ou conta RENTER ativa não encontrada.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description:
          'E-mail diferente da parte, vínculo com outro usuário ou alteração concorrente.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/contracts',
    tags: ['Contracts'],
    summary: 'Lista os contratos visíveis para o ator',
    description:
      'ADMIN e OWNER veem todos os contratos do tenant. Quando o ator tem papel AGENT, a listagem é ' +
      'restrita aos contratos de imóveis dos quais ele é responsável. RENTER vê somente os contratos ' +
      'em que é a parte LOCATARIO vinculada à sua conta, inclusive de imobiliárias fora do seu tenant ' +
      '(tenant compartilhado de locatários). Busca, contagem e paginação aplicam o mesmo escopo.',
    security: [{ bearerAuth: [] }],
    request: { query: listContractsQuerySchema },
    responses: {
      200: {
        description: 'Lista de contratos visíveis para o ator.',
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
    description:
      'Um ator AGENT só cria contrato a partir de oportunidade de imóvel do qual é responsável ' +
      '(404 opaco caso contrário). RENTER não gerencia contratos.',
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
      403: {
        description: 'Autenticado como RENTER — não pode gerenciar contratos.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description:
          'Oportunidade não encontrada neste tenant, ou de imóvel de outro responsável (AGENT).',
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
    summary: 'Consulta um contrato visível para o ator',
    description:
      'Um ator AGENT recebe 404 opaco para um contrato de imóvel do qual não é responsável. ' +
      'RENTER consulta somente contratos em que é a parte LOCATARIO vinculada à sua conta, mesmo ' +
      'fora do seu tenant, e recebe 404 opaco para os demais.',
    security: [{ bearerAuth: [] }],
    request: { params: contractIdParamsSchema },
    responses: {
      200: {
        description: 'Contrato encontrado.',
        content: { 'application/json': { schema: contractResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description:
          'Contrato não encontrado neste tenant, de imóvel de outro responsável (AGENT), ou sem ' +
          'vínculo do RENTER como parte locatária.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/contracts/{id}/parties/{partyId}/sign',
    tags: ['Contracts'],
    summary: 'Registra a assinatura de uma parte do contrato',
    description:
      'Segue a mesma regra de acesso da consulta do contrato: um ator AGENT recebe 404 opaco para ' +
      'um contrato de imóvel do qual não é responsável. RENTER não registra assinaturas, mesmo nos ' +
      'contratos que consegue consultar.',
    security: [{ bearerAuth: [] }],
    request: { params: contractPartyIdParamsSchema },
    responses: {
      200: {
        description: 'Assinatura registrada; contrato ativado se era a última assinatura pendente.',
        content: { 'application/json': { schema: contractResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Autenticado como RENTER — não pode gerenciar contratos.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description:
          'Contrato ou parte não encontrados neste tenant, ou contrato de imóvel de outro ' +
          'responsável (AGENT).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Esta parte já assinou o contrato.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
