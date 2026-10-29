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
      'Rota pública, sem autenticação. Proprietário/imobiliária/construtora e corretor autônomo criam um tenant; locatário entra no tenant compartilhado. ' +
      'Corretor com agencyId solicita vínculo a uma imobiliária AGENCY ACTIVE/TRIAL. Toda conta nova precisa confirmar o e-mail por código antes de receber sessão; ' +
      'o vínculo do corretor também exige aprovação da gestão. A resposta contém email, tenantId e emailSent, sem tokens. ' +
      'Se o envio falhar, a conta é preservada e emailSent=false permite solicitar outro código. Telefone, CRECI e aceite/data são persistidos.',
    request: {
      body: { content: { 'application/json': { schema: registerRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Conta criada, aguardando confirmação de e-mail.',
        content: { 'application/json': { schema: registerResponseSchema } },
      },
      202: {
        description: 'Vínculo criado, aguardando confirmação de e-mail e aprovação da gestão.',
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
    summary: 'Busca imobiliárias elegíveis para novos vínculos de corretor',
    description:
      'Rota pública. Busca por nome sem distinguir maiúsculas/minúsculas, limitada a 20 tenants AGENCY com status ACTIVE ou TRIAL. Usada no cadastro de corretor.',
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
