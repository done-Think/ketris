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
import {
  requestPasswordResetCodeSchema,
  verifyPasswordResetCodeResponseSchema,
  verifyPasswordResetCodeSchema,
} from './schemas/password-reset-code.schema'
import { resetPasswordRequestSchema } from './schemas/reset-password.schema'
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

  registry.registerPath({
    method: 'patch',
    path: '/auth/users/{id}/approve',
    tags: ['Auth'],
    summary: 'Aprova o vínculo pendente de um usuário (proprietário ou agente) com o tenant',
    description:
      'Requer papel ADMIN. Usada para aprovar um corretor que se autocadastrou pedindo para ' +
      'entrar num tenant existente — ele não consegue logar até esse vínculo ser aprovado. ' +
      'Idempotente: aprovar um vínculo já aprovado apenas retorna o usuário sem erro.',
    security: [{ bearerAuth: [] }],
    request: { params: userIdParamsSchema },
    responses: {
      200: {
        description: 'Vínculo aprovado (ou já estava aprovado).',
        content: { 'application/json': { schema: updateUserResponseSchema } },
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
    method: 'post',
    path: '/auth/password-reset-codes',
    tags: ['Auth'],
    summary: 'Envia por e-mail um código de 6 dígitos para iniciar a troca de senha',
    description:
      'Rota pública. E-mail desconhecido retorna 204 do mesmo jeito (mesma postura ' +
      'anti-enumeração do login) — não envia e-mail, mas não revela se a conta existe. Qualquer ' +
      'código anterior ainda ativo do mesmo usuário é invalidado antes de gerar um novo. O código ' +
      'expira em 10 minutos.',
    request: {
      body: {
        content: { 'application/json': { schema: requestPasswordResetCodeSchema } },
      },
    },
    responses: {
      204: {
        description: 'Código enviado (ou e-mail desconhecido — resposta idêntica).',
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/password-reset-codes/verify',
    tags: ['Auth'],
    summary: 'Valida o código de 6 dígitos e emite um token de prova para a troca de senha',
    description:
      'Rota pública. Até 5 tentativas por código; excedido isso (ou expirado), o código é ' +
      'invalidado e é preciso pedir um novo via POST /auth/password-reset-codes. O ' +
      '`resetToken` retornado é um JWT de curta duração (5 min) exigido por ' +
      'POST /auth/reset-password — sem ele, a senha não é trocada.',
    request: {
      body: {
        content: { 'application/json': { schema: verifyPasswordResetCodeSchema } },
      },
    },
    responses: {
      200: {
        description: 'Código válido — token de prova emitido.',
        content: { 'application/json': { schema: verifyPasswordResetCodeResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Código inválido, expirado ou com tentativas excedidas.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/reset-password',
    tags: ['Auth'],
    summary: 'Redefine a senha de um usuário a partir do fluxo de recuperação por e-mail',
    description:
      'Rota pública. Não exige autenticação: o e-mail identifica a conta. Exige um `resetToken` ' +
      'válido (emitido por POST /auth/password-reset-codes/verify, cujo `sub` precisa bater com ' +
      'o usuário do e-mail informado) — sem ele, retorna 401 e a senha não é trocada. Após a troca, ' +
      'todos os refresh tokens ativos do usuário são revogados. E-mail desconhecido retorna 204 do ' +
      'mesmo jeito (mesma postura anti-enumeração do login).',
    request: {
      body: {
        content: { 'application/json': { schema: resetPasswordRequestSchema } },
      },
    },
    responses: {
      204: {
        description: 'Senha redefinida (ou e-mail desconhecido — resposta idêntica).',
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Token de redefinição inválido, expirado, ou de outro usuário.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
