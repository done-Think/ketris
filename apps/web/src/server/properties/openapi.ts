import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  createPropertyRequestSchema,
  listPropertiesQuerySchema,
  updatePropertyRequestSchema,
} from './schemas/property-input.schema'
import {
  propertiesResponseSchema,
  propertyIdParamsSchema,
  propertyResponseSchema,
} from './schemas/property.schema'

export function registerPropertiesOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/properties',
    tags: ['Properties'],
    summary: 'Lista imóveis do tenant autenticado',
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
      200: {
        description: 'Imóvel inativado.',
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
}
