import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import { registerRequestSchema, registerResponseSchema } from './schemas/register.schema'
import {
  searchTenantsQuerySchema,
  searchTenantsResponseSchema,
} from './schemas/search-tenants.schema'

export function registerRegistrationOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'post',
    path: '/register',
    tags: ['Registration'],
    summary: 'Cadastro público — cria uma conta nova na Ketris',
    description:
      'Rota pública, sem autenticação. O comportamento depende do perfil escolhido: ' +
      'proprietário/imobiliária/construtora (e corretor sem agencyId) criam um tenant novo e já ' +
      'retornam sessão logada; corretor com agencyId cria um vínculo pendente de aprovação do ' +
      'ADMIN da imobiliária escolhida (nenhuma sessão é criada); locatário entra no tenant ' +
      'compartilhado de locatários e já retorna sessão logada.',
    request: {
      body: { content: { 'application/json': { schema: registerRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Conta criada e sessão iniciada.',
        content: { 'application/json': { schema: registerResponseSchema } },
      },
      202: {
        description: 'Vínculo criado, aguardando aprovação do administrador da imobiliária.',
        content: { 'application/json': { schema: registerResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Imobiliária (agencyId) não encontrada.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Já existe uma conta com este e-mail nesse tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/tenants/search',
    tags: ['Registration'],
    summary: 'Busca imobiliárias/construtoras cadastradas, para o cadastro de corretor',
    description:
      'Rota pública, sem autenticação. Busca por nome (case-insensitive), excluindo o tenant ' +
      'compartilhado de locatários. Usada pelo autocomplete de "escolher minha imobiliária" no ' +
      'cadastro de corretor.',
    request: { query: searchTenantsQuerySchema },
    responses: {
      200: {
        description: 'Lista de tenants que combinam com a busca.',
        content: { 'application/json': { schema: searchTenantsResponseSchema } },
      },
      400: {
        description: 'Parâmetros de busca inválidos (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
