import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import { getPropertyResponseSchema } from './schemas/get-property.schema'
import {
  searchPropertiesQuerySchema,
  searchPropertiesResponseSchema,
} from './schemas/search-properties.schema'
import {
  submitInquiryRequestSchema,
  submitInquiryResponseSchema,
} from './schemas/submit-inquiry.schema'

const propertyIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'ID do imóvel.', example: 'clx1y2z3a0000abcd1234efgh' }),
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
}
