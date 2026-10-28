import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  propertyOwnersQuerySchema,
  createPropertyRequestSchema,
  listPropertiesQuerySchema,
  updatePropertyRequestSchema,
} from './schemas/property-input.schema'
import {
  propertiesResponseSchema,
  propertyOwnersResponseSchema,
  propertyMediaUploadRequestSchema,
  propertyMediaUploadResponseSchema,
  propertyMediaKeyParamsSchema,
  propertyMediaBinarySchema,
  propertyIdParamsSchema,
  propertyResponseSchema,
} from './schemas/property.schema'

export function registerPropertiesOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/properties/owners',
    tags: ['Properties'],
    summary: 'Lista proprietários ativos do mesmo tenant',
    security: [{ bearerAuth: [] }],
    request: { query: propertyOwnersQuerySchema },
    responses: {
      200: {
        description:
          'Usuários PROPERTY_OWNER ativos do tenant, disponíveis à equipe da imobiliária.',
        content: { 'application/json': { schema: propertyOwnersResponseSchema } },
      },
      401: {
        description: 'Não autenticado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Papel sem permissão para listar proprietários.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/properties',
    tags: ['Properties'],
    summary: 'Lista imóveis do tenant autenticado',
    description:
      'RENTER consulta somente imóveis com contrato ACTIVE do mesmo tenant e vínculo explícito de RENTER ao seu usuário, independentemente do status do anúncio.',
    security: [{ bearerAuth: [] }],
    request: { query: listPropertiesQuerySchema },
    responses: {
      200: {
        description: 'Lista de imóveis do tenant.',
        content: { 'application/json': { schema: propertiesResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/properties',
    tags: ['Properties'],
    summary: 'Cria imóvel em rascunho para o tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createPropertyRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Imóvel criado.',
        content: { 'application/json': { schema: propertyResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/properties/{id}',
    tags: ['Properties'],
    summary: 'Consulta imóvel do tenant autenticado',
    description:
      'RENTER tem acesso somente de leitura aos imóveis dos próprios contratos ATIVOS. Imóveis sem vínculo autorizado retornam 404.',
    security: [{ bearerAuth: [] }],
    request: { params: propertyIdParamsSchema },
    responses: {
      200: {
        description: 'Imóvel encontrado.',
        content: { 'application/json': { schema: propertyResponseSchema } },
      },
      404: {
        description: 'Imóvel não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/properties/{id}',
    tags: ['Properties'],
    summary: 'Atualiza imóvel do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: {
      params: propertyIdParamsSchema,
      body: { content: { 'application/json': { schema: updatePropertyRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Imóvel atualizado.',
        content: { 'application/json': { schema: propertyResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Imóvel não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/properties/{id}',
    tags: ['Properties'],
    summary: 'Inativa imóvel do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: { params: propertyIdParamsSchema },
    responses: {
      204: { description: 'Imóvel inativado. Dados, mídias e vínculos preservados.' },
      404: {
        description: 'Imóvel não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/properties/{id}/publish',
    tags: ['Properties'],
    summary: 'Publica imóvel completo do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: { params: propertyIdParamsSchema },
    responses: {
      200: {
        description: 'Imóvel publicado.',
        content: { 'application/json': { schema: propertyResponseSchema } },
      },
      400: {
        description: 'Imóvel incompleto para publicação.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Imóvel não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/properties/{id}/unpublish',
    tags: ['Properties'],
    summary: 'Despublica imóvel do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: { params: propertyIdParamsSchema },
    responses: {
      200: {
        description: 'Imóvel despublicado.',
        content: { 'application/json': { schema: propertyResponseSchema } },
      },
      404: {
        description: 'Imóvel não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/properties/media',
    tags: ['Properties'],
    summary: 'Envia uma imagem de imóvel',
    description:
      'Disponível para a equipe da imobiliária e proprietários. Aceita JPEG, PNG e WebP até 8 MiB.',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: { 'multipart/form-data': { schema: propertyMediaUploadRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Imagem enviada.',
        content: { 'application/json': { schema: propertyMediaUploadResponseSchema } },
      },
      400: {
        description: 'Arquivo ausente, vazio, muito grande ou com formato não suportado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Papel sem permissão para gerenciar imóveis.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      503: {
        description: 'Serviço de imagens indisponível (PROPERTY_MEDIA_STORAGE_UNAVAILABLE).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/properties/media/{key}',
    tags: ['Properties'],
    summary: 'Consulta uma imagem pública de imóvel',
    description:
      'Serve somente chaves sob properties/. Outros prefixos e segmentos inválidos retornam 404 antes da consulta ao armazenamento.',
    security: [],
    request: { params: propertyMediaKeyParamsSchema },
    responses: {
      200: {
        description: 'Conteúdo binário com cache público imutável por um ano.',
        content: {
          'image/jpeg': { schema: propertyMediaBinarySchema },
          'image/png': { schema: propertyMediaBinarySchema },
          'image/webp': { schema: propertyMediaBinarySchema },
          'application/octet-stream': { schema: propertyMediaBinarySchema },
        },
      },
      404: { description: 'Imagem inexistente ou chave fora do escopo permitido.' },
      503: {
        description: 'Serviço de imagens indisponível (PROPERTY_MEDIA_STORAGE_UNAVAILABLE).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
