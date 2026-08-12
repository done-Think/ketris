import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import { authenticatedPlatformAdminSchema } from './schemas/platform-admin.schema'
import {
  createTenantRequestSchema,
  createTenantResponseSchema,
} from './schemas/create-tenant.schema'
import {
  getPlatformAdminResponseSchema,
  listPlatformAdminsResponseSchema,
} from './schemas/list-platform-admins.schema'
import { listTenantUsersResponseSchema } from './schemas/list-tenant-users.schema'
import { listTenantsResponseSchema } from './schemas/list-tenants.schema'
import {
  loginPlatformRequestSchema,
  loginPlatformResponseSchema,
} from './schemas/login-platform.schema'
import {
  refreshPlatformTokenRequestSchema,
  refreshPlatformTokenResponseSchema,
} from './schemas/refresh-platform-token.schema'
import { tenantSummarySchema } from './schemas/tenant.schema'
import {
  updatePlatformAdminRequestSchema,
  updatePlatformAdminResponseSchema,
} from './schemas/update-platform-admin.schema'

const platformAdminIdParamsSchema = z.object({
  id: z
    .string()
    .openapi({ description: 'ID do platform admin.', example: 'clx1y2z3a0000abcd1234efgh' }),
})

const tenantIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'ID do tenant.', example: 'clx1y2z3a0000abcd1234efgh' }),
})

export function registerPlatformOpenApi(registry: OpenAPIRegistry): void {
  registry.register('AuthenticatedPlatformAdmin', authenticatedPlatformAdminSchema)
  registry.register('TenantSummary', tenantSummarySchema)

  registry.registerPath({
    method: 'post',
    path: '/platform/login',
    tags: ['Platform'],
    summary: 'Autentica um platform admin por e-mail e senha',
    description:
      'Independente do login de tenant (/auth/login) — token assinado com uma chave própria, sem ' +
      'tenantId nenhum no payload.',
    request: {
      body: { content: { 'application/json': { schema: loginPlatformRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Login bem-sucedido.',
        content: { 'application/json': { schema: loginPlatformResponseSchema } },
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
    path: '/platform/refresh',
    tags: ['Platform'],
    summary: 'Troca um refresh token de platform admin válido por um novo access token',
    description: 'Mesma rotação já usada em /auth/refresh, num par de tokens separado.',
    request: {
      body: { content: { 'application/json': { schema: refreshPlatformTokenRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Novo access token e refresh token emitidos.',
        content: { 'application/json': { schema: refreshPlatformTokenResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description:
          'Refresh token inválido, expirado, revogado ou de um platform admin inexistente.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/platform/admins',
    tags: ['Platform'],
    summary: 'Lista todos os platform admins',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Lista de platform admins.',
        content: { 'application/json': { schema: listPlatformAdminsResponseSchema } },
      },
      401: {
        description: 'Access token de platform admin ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/platform/admins/{id}',
    tags: ['Platform'],
    summary: 'Consulta um platform admin',
    security: [{ bearerAuth: [] }],
    request: { params: platformAdminIdParamsSchema },
    responses: {
      200: {
        description: 'Platform admin encontrado.',
        content: { 'application/json': { schema: getPlatformAdminResponseSchema } },
      },
      401: {
        description: 'Access token de platform admin ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Platform admin não encontrado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/platform/admins/{id}',
    tags: ['Platform'],
    summary: 'Atualiza nome e/ou e-mail de um platform admin',
    security: [{ bearerAuth: [] }],
    request: {
      params: platformAdminIdParamsSchema,
      body: { content: { 'application/json': { schema: updatePlatformAdminRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Platform admin atualizado.',
        content: { 'application/json': { schema: updatePlatformAdminResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token de platform admin ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Platform admin não encontrado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Já existe um platform admin com este e-mail.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/platform/admins/{id}',
    tags: ['Platform'],
    summary: 'Desativa um platform admin — soft delete',
    description: 'Um platform admin não pode desativar a própria conta por esta rota.',
    security: [{ bearerAuth: [] }],
    request: { params: platformAdminIdParamsSchema },
    responses: {
      200: {
        description: 'Platform admin desativado.',
        content: { 'application/json': { schema: updatePlatformAdminResponseSchema } },
      },
      400: {
        description: 'Tentativa de desativar a própria conta.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token de platform admin ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Platform admin não encontrado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/platform/tenants',
    tags: ['Platform'],
    summary: 'Lista todos os tenants da plataforma',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Lista de tenants.',
        content: { 'application/json': { schema: listTenantsResponseSchema } },
      },
      401: {
        description: 'Access token de platform admin ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/platform/tenants',
    tags: ['Platform'],
    summary: 'Cria um novo tenant',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createTenantRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Tenant criado.',
        content: { 'application/json': { schema: createTenantResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token de platform admin ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Já existe um tenant com este slug.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/platform/tenants/{id}/users',
    tags: ['Platform'],
    summary: 'Lista todos os usuários de um tenant, incluindo contas ADMIN',
    description:
      'Diferente de GET /auth/users (spec 002), que nunca revela contas ADMIN — um platform admin ' +
      'enxerga tudo.',
    security: [{ bearerAuth: [] }],
    request: { params: tenantIdParamsSchema },
    responses: {
      200: {
        description: 'Lista de usuários do tenant.',
        content: { 'application/json': { schema: listTenantUsersResponseSchema } },
      },
      401: {
        description: 'Access token de platform admin ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Tenant não encontrado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
