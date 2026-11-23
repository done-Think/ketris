import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  favoritePropertiesResponseSchema,
  favoritePropertyParamsSchema,
  savedFavoritePropertySchema,
} from './schemas/favorite-property.schema'

const errorContent = { 'application/json': { schema: errorResponseSchema } }

export function registerFavoritePropertyOpenApi(registry: OpenAPIRegistry) {
  const common = { tags: ['Marketplace'], security: [{ bearerAuth: [] }] }
  const unauthorized = { 401: { description: 'Autenticação obrigatória.', content: errorContent } }

  registry.registerPath({
    ...common,
    method: 'get',
    path: '/marketplace/favorites',
    summary: 'Lista os imóveis favoritos de quem está logado',
    description:
      'Qualquer usuário de tenant logado. Retorna só os favoritos do próprio usuário, do mais ' +
      'recente para o mais antigo, até o limite. O favorito guarda o tenant de quem salvou e pode ' +
      'apontar para imóvel de qualquer tenant (mesma exceção do marketplace público). Imóvel que ' +
      'deixou de estar publicado volta com available=false e só título, cidade e bairro.',
    responses: {
      ...unauthorized,
      200: {
        description: 'Favoritos do usuário.',
        content: { 'application/json': { schema: favoritePropertiesResponseSchema } },
      },
    },
  })

  registry.registerPath({
    ...common,
    method: 'put',
    path: '/marketplace/favorites/{propertyId}',
    summary: 'Salva um imóvel publicado nos favoritos',
    description:
      'Idempotente: se o imóvel já estava salvo, devolve a data original. Só imóveis publicados ' +
      'podem ser salvos.',
    request: { params: favoritePropertyParamsSchema },
    responses: {
      ...unauthorized,
      400: { description: 'ID do imóvel inválido.', content: errorContent },
      404: { description: 'Imóvel não encontrado ou não publicado.', content: errorContent },
      422: { description: 'Limite de favoritos atingido.', content: errorContent },
      200: {
        description: 'Imóvel salvo.',
        content: { 'application/json': { schema: savedFavoritePropertySchema } },
      },
    },
  })

  registry.registerPath({
    ...common,
    method: 'delete',
    path: '/marketplace/favorites/{propertyId}',
    summary: 'Remove um imóvel dos favoritos',
    description: 'Idempotente: responde 204 mesmo que o imóvel não estivesse salvo.',
    request: { params: favoritePropertyParamsSchema },
    responses: {
      ...unauthorized,
      400: { description: 'ID do imóvel inválido.', content: errorContent },
      204: { description: 'Imóvel removido dos favoritos.' },
    },
  })
}
