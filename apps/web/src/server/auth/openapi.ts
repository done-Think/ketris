import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import { createUserRequestSchema, createUserResponseSchema } from './schemas/create-user.schema'
import { getUserResponseSchema, listUsersResponseSchema } from './schemas/list-users.schema'
import { loginRequestSchema, loginResponseSchema } from './schemas/login.schema'
import {
  refreshTokenRequestSchema,
  refreshTokenResponseSchema,
} from './schemas/refresh-token.schema'
import { updateUserRequestSchema, updateUserResponseSchema } from './schemas/update-user.schema'
import { authenticatedUserSchema } from './schemas/user.schema'

const userIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'ID do usuário.', example: 'clx1y2z3a0000abcd1234efgh' }),
})

export function registerAuthOpenApi(registry: OpenAPIRegistry): void {
  registry.register('AuthenticatedUser', authenticatedUserSchema)
  registry.register('ErrorResponse', errorResponseSchema)

  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Auth'],
    summary: 'Autentica um usuário por e-mail e senha',
    description:
      'Retorna os dados do usuário, um access token (JWT, 1h) e um refresh token (opaco, 30 dias). ' +
      'Mensagem de erro deliberadamente genérica para não permitir enumeração de e-mails cadastrados.',
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
        description: 'Credenciais inválidas ou conta desativada.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/refresh',
    tags: ['Auth'],
    summary: 'Troca um refresh token válido por um novo access token',
    description:
      'Rotaciona o refresh token a cada uso: o token enviado é revogado e um novo é retornado ' +
      'junto com o novo access token. Reuso de um refresh token já revogado retorna 401.',
    request: {
      body: {
        content: { 'application/json': { schema: refreshTokenRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Novo access token e refresh token emitidos.',
        content: { 'application/json': { schema: refreshTokenResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Refresh token inválido, expirado, revogado ou de um usuário inexistente.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/users',
    tags: ['Auth'],
    summary: 'Cria um usuário (proprietário ou agente) no tenant do administrador autenticado',
    description:
      'Requer um access token de um usuário com papel ADMIN. O usuário criado sempre pertence ao ' +
      'mesmo tenant do administrador autenticado (tenantId nunca vem do corpo da requisição). O papel ' +
      'aceito por este endpoint é restrito a OWNER ou AGENT — administradores são criados por uma via ' +
      'separada.',
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

  registry.registerPath({
    method: 'get',
    path: '/auth/users',
    tags: ['Auth'],
    summary: 'Lista os usuários (proprietários e agentes) do tenant do administrador autenticado',
    description: 'Requer papel ADMIN. Contas ADMIN nunca aparecem nesta listagem.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Lista de usuários do tenant.',
        content: { 'application/json': { schema: listUsersResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Autenticado, mas sem papel ADMIN.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/auth/users/{id}',
    tags: ['Auth'],
    summary: 'Consulta um usuário (proprietário ou agente) do tenant do administrador autenticado',
    description: 'Requer papel ADMIN. Contas ADMIN nunca são retornadas por esta rota.',
    security: [{ bearerAuth: [] }],
    request: { params: userIdParamsSchema },
    responses: {
      200: {
        description: 'Usuário encontrado.',
        content: { 'application/json': { schema: getUserResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Autenticado, mas sem papel ADMIN.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Usuário não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/auth/users/{id}',
    tags: ['Auth'],
    summary: 'Atualiza nome, e-mail e/ou papel de um usuário (proprietário ou agente)',
    description:
      'Requer papel ADMIN. O papel só pode ser trocado entre OWNER e AGENT — não é possível promover ' +
      'um usuário a ADMIN por esta rota.',
    security: [{ bearerAuth: [] }],
    request: {
      params: userIdParamsSchema,
      body: {
        content: { 'application/json': { schema: updateUserRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Usuário atualizado.',
        content: { 'application/json': { schema: updateUserResponseSchema } },
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
      404: {
        description: 'Usuário não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Já existe um usuário com este e-mail neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/auth/users/{id}',
    tags: ['Auth'],
    summary: 'Desativa um usuário (proprietário ou agente) — soft delete',
    description:
      'Requer papel ADMIN. Não remove o registro do banco: marca a conta como inativa (ativo = false) ' +
      'e revoga todos os refresh tokens ativos do usuário. Um administrador não pode desativar a própria ' +
      'conta por esta rota.',
    security: [{ bearerAuth: [] }],
    request: { params: userIdParamsSchema },
    responses: {
      200: {
        description: 'Usuário desativado.',
        content: { 'application/json': { schema: updateUserResponseSchema } },
      },
      400: {
        description: 'Tentativa de desativar a própria conta.',
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
      404: {
        description: 'Usuário não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
