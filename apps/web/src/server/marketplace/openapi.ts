import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import { getPropertyResponseSchema } from './schemas/get-property.schema'
import { deleteInquiryQuerySchema } from './schemas/delete-inquiry.schema'
import {
  getInquiryResponseSchema,
  listInquiriesQuerySchema,
  listInquiriesResponseSchema,
} from './schemas/list-inquiries.schema'
import {
  searchPropertiesQuerySchema,
  searchPropertiesResponseSchema,
} from './schemas/search-properties.schema'
import {
  submitInquiryRequestSchema,
  submitInquiryResponseSchema,
} from './schemas/submit-inquiry.schema'
import {
  patchInquiryRequestSchema,
  putInquiryRequestSchema,
  updateInquiryResponseSchema,
} from './schemas/update-inquiry.schema'

const propertyIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'ID do imóvel.', example: 'clx1y2z3a0000abcd1234efgh' }),
})

const inquiryIdParamsSchema = z.object({
  id: z.string().openapi({
    description: 'ID da proposta (oportunidade).',
    example: 'clx1y2z3a0000abcd1234efgh',
  }),
})

export function registerMarketplaceOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/marketplace/properties',
    tags: ['Marketplace'],
    summary: 'Busca imóveis publicados no marketplace público',
    description:
      'Rota pública, sem autenticação. Retorna apenas imóveis com status PUBLICADO, de todos os ' +
      'tenants (é o marketplace público da Ketris — exceção documentada ao isolamento por tenant do ' +
      'Princípio II). Aceita filtros opcionais por finalidade, tipo, cidade, faixa de preço, número ' +
      'mínimo de quartos e busca textual.',
    request: {
      query: searchPropertiesQuerySchema,
    },
    responses: {
      200: {
        description: 'Lista de imóveis publicados que atendem aos filtros.',
        content: { 'application/json': { schema: searchPropertiesResponseSchema } },
      },
      400: {
        description: 'Parâmetros de busca inválidos (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/marketplace/properties/{id}',
    tags: ['Marketplace'],
    summary: 'Consulta o detalhe de um imóvel publicado',
    description:
      'Rota pública, sem autenticação. Retorna o detalhe completo (endereço, mídias, valores) de um ' +
      'imóvel apenas quando ele está PUBLICADO. Imóvel inexistente ou não publicado responde 404.',
    request: { params: propertyIdParamsSchema },
    responses: {
      200: {
        description: 'Imóvel encontrado.',
        content: { 'application/json': { schema: getPropertyResponseSchema } },
      },
      404: {
        description: 'Imóvel não encontrado ou não publicado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/marketplace/properties/{id}/inquiries',
    tags: ['Marketplace'],
    summary: 'Envia uma proposta de interesse em um imóvel publicado',
    description:
      'Rota pública, sem autenticação (o interessado não precisa ter conta). Cria uma oportunidade ' +
      '(lead) no CRM do tenant dono do imóvel, com status ENVIADA, vinculada ao imóvel e aos dados de ' +
      'contato do interessado. Quando o valor proposto é omitido, assume o valor anunciado do imóvel.',
    request: {
      params: propertyIdParamsSchema,
      body: {
        content: { 'application/json': { schema: submitInquiryRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Oportunidade criada a partir da proposta.',
        content: { 'application/json': { schema: submitInquiryResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Imóvel não encontrado ou não publicado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/marketplace/inquiries',
    tags: ['Marketplace'],
    summary: 'Lista as propostas (leads) do tenant autenticado',
    description:
      'Requer autenticação (Bearer) de um usuário do tenant. Retorna apenas as propostas do próprio ' +
      'tenant do ator. Por padrão exclui as arquivadas (soft delete); use includeArchived=true para ' +
      'incluí-las, e status para filtrar por etapa.',
    security: [{ bearerAuth: [] }],
    request: { query: listInquiriesQuerySchema },
    responses: {
      200: {
        description: 'Lista de propostas do tenant.',
        content: { 'application/json': { schema: listInquiriesResponseSchema } },
      },
      400: {
        description: 'Parâmetros de busca inválidos (falha de validação Zod).',
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
    path: '/marketplace/inquiries/{id}',
    tags: ['Marketplace'],
    summary: 'Consulta uma proposta (lead) do tenant autenticado',
    description:
      'Requer autenticação (Bearer). Uma proposta de outro tenant responde 404 (opaco), igual a um id ' +
      'inexistente.',
    security: [{ bearerAuth: [] }],
    request: { params: inquiryIdParamsSchema },
    responses: {
      200: {
        description: 'Proposta encontrada.',
        content: { 'application/json': { schema: getInquiryResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Proposta não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'put',
    path: '/marketplace/inquiries/{id}',
    tags: ['Marketplace'],
    summary: 'Substitui (atualização completa) uma proposta do tenant autenticado',
    description:
      'Requer autenticação (Bearer). Semântica de representação total: os campos-núcleo são ' +
      'obrigatórios e os campos opcionais omitidos são redefinidos para o valor padrão.',
    security: [{ bearerAuth: [] }],
    request: {
      params: inquiryIdParamsSchema,
      body: { content: { 'application/json': { schema: putInquiryRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Proposta atualizada.',
        content: { 'application/json': { schema: updateInquiryResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Proposta não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/marketplace/inquiries/{id}',
    tags: ['Marketplace'],
    summary: 'Atualiza parcialmente uma proposta do tenant autenticado',
    description:
      'Requer autenticação (Bearer). Atualiza apenas os campos informados; ao menos um campo deve ser ' +
      'enviado.',
    security: [{ bearerAuth: [] }],
    request: {
      params: inquiryIdParamsSchema,
      body: { content: { 'application/json': { schema: patchInquiryRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Proposta atualizada.',
        content: { 'application/json': { schema: updateInquiryResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Proposta não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/marketplace/inquiries/{id}',
    tags: ['Marketplace'],
    summary: 'Arquiva (soft delete) ou exclui permanentemente uma proposta',
    description:
      'Requer autenticação (Bearer). Por padrão faz soft delete (marca arquivadaEm e retorna a ' +
      'proposta arquivada, 200). Com permanent=true, remove o registro do banco definitivamente (204).',
    security: [{ bearerAuth: [] }],
    request: { params: inquiryIdParamsSchema, query: deleteInquiryQuerySchema },
    responses: {
      200: {
        description: 'Proposta arquivada (soft delete).',
        content: { 'application/json': { schema: updateInquiryResponseSchema } },
      },
      204: {
        description: 'Proposta excluída permanentemente (permanent=true).',
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Proposta não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
