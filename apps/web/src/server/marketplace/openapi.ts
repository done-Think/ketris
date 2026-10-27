import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  getAgencyProfileResponseSchema,
  listAgenciesResponseSchema,
  ownAgencyProfileResponseSchema,
  saveAgencyProfileRequestSchema,
} from './schemas/agency-profile.schema'
import {
  getBrokerProfileResponseSchema,
  listBrokersResponseSchema,
  ownBrokerProfileResponseSchema,
  saveBrokerProfileRequestSchema,
} from './schemas/broker-profile.schema'
import { getPropertyResponseSchema } from './schemas/get-property.schema'
import { listPublicProfilesQuerySchema } from './schemas/profile-directory.schema'
import {
  profileMediaBinarySchema,
  profileMediaKeyParamsSchema,
  profileMediaUploadRequestSchema,
  profileMediaUploadResponseSchema,
} from './schemas/profile-media.schema'
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

const agencyIdParamsSchema = z.object({
  id: z
    .string()
    .openapi({ description: 'ID do perfil público da imobiliária.', example: 'clx1y2z3a0000agcy' }),
})

const brokerIdParamsSchema = z.object({
  id: z
    .string()
    .openapi({ description: 'ID do perfil público do corretor.', example: 'clx1y2z3a0000brkr' }),
})

export function registerMarketplaceOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/marketplace/properties',
    tags: ['Marketplace'],
    summary: 'Busca imóveis publicados no marketplace público',
    description:
      'Rota pública, sem autenticação. Retorna apenas imóveis com status PUBLISHED, de todos os ' +
      'tenants (é o marketplace público da Ketris — exceção documentada ao isolamento por tenant do ' +
      'Princípio II). Aceita filtros opcionais por finalidade (purpose), tipo de imóvel, cidade ' +
      '(match exato) ou localização (location, substring em bairro/cidade), faixa de preço, número ' +
      'mínimo de quartos, área mínima, vaga de garagem, ordenação e busca textual. Resultado ' +
      'paginado: page (padrão 1) e pageSize (padrão 12, máximo 50); totalCount traz o total ' +
      'de imóveis que atendem aos filtros.',
    request: {
      query: searchPropertiesQuerySchema,
    },
    responses: {
      200: {
        description: 'Página de imóveis publicados que atendem aos filtros.',
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
      'imóvel apenas quando ele está PUBLISHED. Imóvel inexistente ou não publicado responde 404.',
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
    path: '/marketplace/agencies',
    tags: ['Marketplace'],
    summary: 'Lista imobiliárias com perfil público publicado',
    description:
      'Rota pública, sem autenticação. Retorna todas as imobiliárias de todos os ' +
      'tenants com perfil público no status PUBLISHED, paginados (page, padrão 1; pageSize, ' +
      'padrão 12 e máximo 50). q busca, sem diferenciar acentos e maiúsculas, no nome, CRECI e ' +
      'demais textos do perfil; totalCount traz o total encontrado.',
    request: { query: listPublicProfilesQuerySchema },
    responses: {
      200: {
        description: 'Página de perfis públicos de imobiliárias.',
        content: { 'application/json': { schema: listAgenciesResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/marketplace/agencies/{id}',
    tags: ['Marketplace'],
    summary: 'Consulta o perfil público de uma imobiliária',
    description:
      'Rota pública, sem autenticação. Retorna 404 se o perfil não existir ou não ' +
      'estiver publicado.',
    request: { params: agencyIdParamsSchema },
    responses: {
      200: {
        description: 'Perfil público da imobiliária.',
        content: { 'application/json': { schema: getAgencyProfileResponseSchema } },
      },
      404: {
        description: 'Perfil não encontrado ou não publicado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/marketplace/brokers',
    tags: ['Marketplace'],
    summary: 'Lista corretores com perfil público publicado',
    description:
      'Rota pública, sem autenticação. Retorna todos os corretores de todos os ' +
      'tenants com perfil público no status PUBLISHED, paginados (page, padrão 1; pageSize, ' +
      'padrão 12 e máximo 50). q busca, sem diferenciar acentos e maiúsculas, no nome, CRECI e ' +
      'demais textos do perfil; totalCount traz o total encontrado.',
    request: { query: listPublicProfilesQuerySchema },
    responses: {
      200: {
        description: 'Página de perfis públicos de corretores.',
        content: { 'application/json': { schema: listBrokersResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/marketplace/brokers/{id}',
    tags: ['Marketplace'],
    summary: 'Consulta o perfil público de um corretor',
    description:
      'Rota pública, sem autenticação. Retorna 404 se o perfil não existir ou não ' +
      'estiver publicado.',
    request: { params: brokerIdParamsSchema },
    responses: {
      200: {
        description: 'Perfil público do corretor.',
        content: { 'application/json': { schema: getBrokerProfileResponseSchema } },
      },
      404: {
        description: 'Perfil não encontrado ou não publicado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/marketplace/profiles/agency',
    tags: ['Marketplace'],
    summary: 'Consulta o próprio perfil público de imobiliária do tenant autenticado',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Perfil (rascunho ou publicado) do tenant autenticado.',
        content: { 'application/json': { schema: ownAgencyProfileResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'put',
    path: '/marketplace/profiles/agency',
    tags: ['Marketplace'],
    summary: 'Salva o próprio perfil público de imobiliária do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: saveAgencyProfileRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Perfil salvo (continua rascunho até publicar).',
        content: { 'application/json': { schema: ownAgencyProfileResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/marketplace/profiles/agency/publish',
    tags: ['Marketplace'],
    summary: 'Publica o perfil público de imobiliária do tenant autenticado',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Perfil publicado.',
        content: { 'application/json': { schema: ownAgencyProfileResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Perfil ainda não foi salvo nenhuma vez.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      422: {
        description: 'Faltam campos obrigatórios para publicar.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/marketplace/profiles/agency/unpublish',
    tags: ['Marketplace'],
    summary: 'Despublica o perfil público de imobiliária do tenant autenticado',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Perfil despublicado (volta a rascunho).',
        content: { 'application/json': { schema: ownAgencyProfileResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Perfil ainda não foi salvo nenhuma vez.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/marketplace/profiles/broker',
    tags: ['Marketplace'],
    summary: 'Consulta o próprio perfil público de corretor do usuário autenticado',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Perfil (rascunho ou publicado) do usuário autenticado.',
        content: { 'application/json': { schema: ownBrokerProfileResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'put',
    path: '/marketplace/profiles/broker',
    tags: ['Marketplace'],
    summary: 'Salva o próprio perfil público de corretor do usuário autenticado',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: saveBrokerProfileRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Perfil salvo (continua rascunho até publicar).',
        content: { 'application/json': { schema: ownBrokerProfileResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/marketplace/profiles/broker/publish',
    tags: ['Marketplace'],
    summary: 'Publica o perfil público de corretor do usuário autenticado',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Perfil publicado.',
        content: { 'application/json': { schema: ownBrokerProfileResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Perfil ainda não foi salvo nenhuma vez.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      422: {
        description: 'Faltam campos obrigatórios para publicar.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/marketplace/profiles/broker/unpublish',
    tags: ['Marketplace'],
    summary: 'Despublica o perfil público de corretor do usuário autenticado',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Perfil despublicado (volta a rascunho).',
        content: { 'application/json': { schema: ownBrokerProfileResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Perfil ainda não foi salvo nenhuma vez.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/marketplace/profiles/media',
    tags: ['Marketplace'],
    summary: 'Envia imagem do perfil público (avatar, banner ou logo)',
    description:
      'broker-avatar e broker-banner exigem perfil de corretor; agency-logo e agency-banner exigem ' +
      'gestor da imobiliária. A chave é derivada do usuário ou do tenant autenticado. Devolve a URL ' +
      'pública para salvar no perfil.',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: { 'multipart/form-data': { schema: profileMediaUploadRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Imagem enviada.',
        content: { 'application/json': { schema: profileMediaUploadResponseSchema } },
      },
      400: {
        description:
          'Arquivo ausente, vazio, maior que 8 MiB, de tipo não suportado ou destino inválido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Papel sem permissão para o destino informado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/marketplace/media/{key}',
    tags: ['Marketplace'],
    summary: 'Consulta uma imagem pública de perfil',
    description:
      'Rota pública. Serve somente chaves sob profiles/brokers/ e profiles/agencies/; outros ' +
      'prefixos e segmentos inválidos retornam 404 antes da consulta ao armazenamento.',
    security: [],
    request: { params: profileMediaKeyParamsSchema },
    responses: {
      200: {
        description: 'Conteúdo binário com cache público imutável por um ano.',
        content: {
          'image/jpeg': { schema: profileMediaBinarySchema },
          'image/png': { schema: profileMediaBinarySchema },
          'image/webp': { schema: profileMediaBinarySchema },
          'application/octet-stream': { schema: profileMediaBinarySchema },
        },
      },
      404: { description: 'Imagem inexistente ou chave fora do escopo permitido.' },
    },
  })
}
