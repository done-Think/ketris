import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import { createUserRequestSchema, createUserResponseSchema } from './schemas/create-user.schema'
import { loginRequestSchema, loginResponseSchema } from './schemas/login.schema'
import { authenticatedUserSchema } from './schemas/user.schema'

export function registerAuthOpenApi(registry: OpenAPIRegistry): void {
  registry.register('AuthenticatedUser', authenticatedUserSchema)
  registry.register('ErrorResponse', errorResponseSchema)

  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Auth'],
    summary: 'Autentica um usuário por e-mail e senha',
    description:
      'Retorna os dados do usuário e um access token (JWT, 1h). Mensagem de erro deliberadamente ' +
      'genérica para não permitir enumeração de e-mails cadastrados.',
    request: {
      body: {
        content: { 'application/json': { schema: loginRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Login bem-sucedido.',
        content: { 'application/json': { schema: loginResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Credenciais inválidas.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/users',
    tags: ['Auth'],
    summary: 'Cria um usuário no tenant do administrador autenticado',
    description:
      'Requer um access token de um usuário com papel ADMIN. O usuário criado sempre pertence ao ' +
      'mesmo tenant do administrador autenticado (tenantId nunca vem do corpo da requisição).',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: { 'application/json': { schema: createUserRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Usuário criado.',
        content: { 'application/json': { schema: createUserResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Autenticado, mas sem papel ADMIN.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Já existe um usuário com este e-mail neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
