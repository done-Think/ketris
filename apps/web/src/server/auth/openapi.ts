import {
  avatarUploadSchema,
  avatarUploadResponseSchema,
  avatarMediaParamsSchema,
  avatarBinarySchema,
} from './schemas/avatar.schema'
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import { createUserRequestSchema, createUserResponseSchema } from './schemas/create-user.schema'
import { getUserResponseSchema, listUsersResponseSchema } from './schemas/list-users.schema'
import { loginRequestSchema, loginResponseSchema } from './schemas/login.schema'
import { logoutRequestSchema } from './schemas/logout.schema'
import {
  refreshTokenRequestSchema,
  refreshTokenResponseSchema,
} from './schemas/refresh-token.schema'
import {
  requestPasswordResetCodeSchema,
  verifyPasswordResetCodeResponseSchema,
  verifyPasswordResetCodeSchema,
} from './schemas/password-reset-code.schema'
import { changeOwnPasswordRequestSchema } from './schemas/change-own-password.schema'
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
    path: '/auth/me/avatar',
    tags: ['Auth'],
    summary: 'Envia o avatar do usuário autenticado',
    description:
      'Qualquer usuário ativo pode enviar o próprio avatar, inclusive RENTER. O destino é definido pela identidade autenticada.',
    security: [{ bearerAuth: [] }],
    request: {
      body: { required: true, content: { 'multipart/form-data': { schema: avatarUploadSchema } } },
    },
    responses: {
      201: {
        description: 'Avatar enviado para posterior atualização do perfil.',
        content: { 'application/json': { schema: avatarUploadResponseSchema } },
      },
      400: {
        description: 'Arquivo inválido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Não autenticado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Usuário desativado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Usuário não encontrado no tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/auth/media/{key}',
    tags: ['Auth'],
    summary: 'Consulta imagem pública de avatar',
    description: 'Serve somente chaves no formato avatars/<tenant>/<usuário>/<arquivo>.',
    security: [],
    request: { params: avatarMediaParamsSchema },
    responses: {
      200: {
        description: 'Imagem de avatar.',
        content: {
          'image/jpeg': { schema: avatarBinarySchema },
          'image/png': { schema: avatarBinarySchema },
          'image/webp': { schema: avatarBinarySchema },
        },
      },
      404: { description: 'Imagem inexistente ou chave inválida.' },
    },
  })
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
    summary: 'Cria um usuário (dono, corretor ou proprietário) no tenant do dono autenticado',
    description:
      'Requer um access token de um usuário com papel OWNER. O usuário criado sempre pertence ao ' +
      'mesmo tenant do dono autenticado (tenantId nunca vem do corpo da requisição). O papel ' +
      'aceito por este endpoint é OWNER, AGENT ou PROPERTY_OWNER.',
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
        description: 'Autenticado, mas sem papel OWNER.',
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
    summary: 'Lista os usuários do tenant do dono autenticado',
    description: 'Requer papel OWNER.',
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
        description: 'Autenticado, mas sem papel OWNER.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/auth/users/{id}',
    tags: ['Auth'],
    summary: 'Consulta um usuário do tenant do dono autenticado',
    description: 'Requer papel OWNER.',
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
        description: 'Autenticado, mas sem papel OWNER.',
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
      'Requer papel OWNER. O papel só pode ser trocado entre OWNER, AGENT e PROPERTY_OWNER.',
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
        description: 'Autenticado, mas sem papel OWNER.',
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
      'Requer papel OWNER. Não remove o registro do banco: marca a conta como inativa (ativo = false) ' +
      'e revoga todos os refresh tokens ativos do usuário. Um dono não pode desativar a própria ' +
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
        description: 'Autenticado, mas sem papel OWNER.',
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
      'Requer papel OWNER. Usada para aprovar um corretor que se autocadastrou pedindo para ' +
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
        description: 'Autenticado, mas sem papel OWNER.',
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

  registry.registerPath({
    method: 'post',
    path: '/auth/logout',
    tags: ['Auth'],
    summary: 'Revoga um refresh token, encerrando a sessão',
    description:
      'Idempotente: revogar um refresh token já revogado (ou inexistente) também ' +
      'retorna 204, sem erro.',
    request: {
      body: {
        content: { 'application/json': { schema: logoutRequestSchema } },
      },
    },
    responses: {
      204: {
        description: 'Refresh token revogado (ou já estava revogado/inexistente).',
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/me/password',
    tags: ['Auth'],
    summary: 'Troca a senha do próprio usuário autenticado',
    description:
      'Diferente de POST /auth/reset-password (fluxo de recuperação por e-mail): aqui o usuário ' +
      'já está autenticado via access token e troca a própria senha informando a senha atual, sem ' +
      'precisar de código de verificação. Revoga todos os refresh tokens ativos do usuário após a troca.',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: { 'application/json': { schema: changeOwnPasswordRequestSchema } },
      },
    },
    responses: {
      204: {
        description: 'Senha alterada.',
      },
      400: {
        description:
          'Corpo da requisição inválido (falha de validação Zod) ou senha atual incorreta ' +
          '(code INVALID_CURRENT_PASSWORD).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido, expirado, ou usuário inexistente/inativo.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
