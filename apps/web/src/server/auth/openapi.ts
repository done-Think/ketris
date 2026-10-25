import {
  avatarUploadSchema,
  avatarUploadResponseSchema,
  avatarMediaParamsSchema,
  avatarBinarySchema,
} from './schemas/avatar.schema'
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import { createUserRequestSchema, createUserResponseSchema } from './schemas/create-user.schema'
import {
  getUserResponseSchema,
  listUsersResponseSchema,
  listUsersQuerySchema,
} from './schemas/list-users.schema'
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
import { userIdParamsSchema } from './schemas/user-params.schema'
import {
  requestSignupVerificationSchema,
  confirmSignupVerificationSchema,
  confirmSignupVerificationResponseSchema,
  requestEmailChangeSchema,
  confirmEmailChangeSchema,
  publicConfirmEmailChangeSchema,
} from './schemas/email-verification.schema'

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
      'Após validar a senha, retorna os dados do usuário e tokens, ou as contas disponíveis quando ' +
      'é necessário selecionar tenantId. O fluxo de e-mail pendente exige confirmação antes do acesso. ' +
      'Mensagem de erro deliberadamente genérica para não permitir enumeração de e-mails cadastrados.',
    request: {
      body: {
        content: { 'application/json': { schema: loginRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Sessão autenticada ou próxima etapa necessária para concluir o acesso.',
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
      403: {
        description: 'Conta desativada, vínculo pendente ou acesso do tenant bloqueado.',
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
        description: 'Usuário autenticado sem permissão para esta operação.',
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
    request: { query: listUsersQuerySchema },
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
        description: 'Usuário autenticado sem permissão para esta operação.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/auth/users/{id}',
    tags: ['Auth'],
    summary: 'Consulta o próprio perfil ou um usuário do tenant',
    description:
      'O próprio usuário pode consultar seu perfil. Consultar outros usuários do tenant requer papel OWNER.',
    security: [{ bearerAuth: [] }],
    request: { params: userIdParamsSchema },
    responses: {
      400: {
        description: 'Parâmetro de identificação inválido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      200: {
        description: 'Usuário encontrado.',
        content: { 'application/json': { schema: getUserResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Usuário autenticado sem permissão para esta operação.',
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
    summary: 'Atualiza os dados de um usuário do tenant',
    description:
      'O próprio usuário pode editar seu perfil. A gestão com papel OWNER pode editar usuários do ' +
      'tenant. O papel só pode ser trocado entre OWNER, AGENT e PROPERTY_OWNER pela gestão. ' +
      'A alteração de e-mail depende de confirmação no fluxo de troca de e-mail.',
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
        description: 'Usuário autenticado sem permissão para esta operação.',
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
        description: 'Usuário autenticado sem permissão para esta operação.',
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
      400: {
        description: 'Parâmetro de identificação inválido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      200: {
        description: 'Vínculo aprovado (ou já estava aprovado).',
        content: { 'application/json': { schema: updateUserResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Usuário autenticado sem permissão para esta operação.',
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
      'código anterior ainda ativo do mesmo e-mail é invalidado ao gerar um novo. O código ' +
      'expira em 10 minutos. Solicitações durante o intervalo de reenvio também retornam 204.',
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
      'Rota pública. O código prova o acesso à caixa de e-mail antes de qualquer listagem de contas. ' +
      'Se o e-mail pertencer a mais de um tenant e tenantId não for informado, retorna SELECT_TENANT ' +
      'sem consumir o código. Envie o mesmo e-mail e código com tenantId para escolher a conta e ' +
      'receber resetToken. O token dura 5 minutos e é exigido em POST /auth/reset-password. ' +
      'Até 5 tentativas inválidas por código; códigos expirados ou esgotados exigem novo envio.',
    request: {
      body: {
        content: { 'application/json': { schema: verifyPasswordResetCodeSchema } },
      },
    },
    responses: {
      200: {
        description: 'Código válido: token de redefinição emitido ou seleção de tenant necessária.',
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
      'Rota pública. Exige resetToken emitido por POST /auth/password-reset-codes/verify para a ' +
      'conta selecionada. O e-mail, tenantId quando informado e versão da sessão precisam corresponder ' +
      'ao token. A troca da senha invalida a prova utilizada, os access tokens anteriores e todos os ' +
      'refresh tokens do usuário. Prova inválida retorna 401 sem alterar a senha.',
    request: {
      body: {
        content: { 'application/json': { schema: resetPasswordRequestSchema } },
      },
    },
    responses: {
      204: {
        description: 'Senha redefinida e sessões anteriores invalidadas.',
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

  const jsonError = { 'application/json': { schema: errorResponseSchema } }

  registry.registerPath({
    method: 'post',
    path: '/auth/email-verification-codes',
    tags: ['Auth'],
    summary: 'Envia um código para confirmar o e-mail de cadastro',
    description:
      'Rota pública. A resposta não revela se existe cadastro pendente para o e-mail e tenant informados.',
    security: [],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: requestSignupVerificationSchema } },
      },
    },
    responses: {
      204: { description: 'Solicitação processada.' },
      400: { description: 'Corpo da requisição inválido.', content: jsonError },
      429: { description: 'Limite de solicitações de código excedido.', content: jsonError },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/email-verification-codes/verify',
    tags: ['Auth'],
    summary: 'Confirma o e-mail de cadastro por código',
    description:
      'Retorna a sessão quando o acesso está liberado ou informa que o vínculo aguarda aprovação.',
    security: [],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: confirmSignupVerificationSchema } },
      },
    },
    responses: {
      200: {
        description: 'E-mail confirmado.',
        content: { 'application/json': { schema: confirmSignupVerificationResponseSchema } },
      },
      400: { description: 'Dados ou código de confirmação inválidos.', content: jsonError },
      403: { description: 'Conta ou tenant sem acesso permitido.', content: jsonError },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/me/email-change',
    tags: ['Auth'],
    summary: 'Envia um código para confirmar o novo e-mail do próprio usuário',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: requestEmailChangeSchema } },
      },
    },
    responses: {
      204: {
        description: 'Solicitação processada; o e-mail atual é preservado até a confirmação.',
      },
      400: { description: 'Corpo da requisição inválido.', content: jsonError },
      401: { description: 'Access token ausente, inválido ou expirado.', content: jsonError },
      403: { description: 'Conta ou tenant sem acesso permitido.', content: jsonError },
      404: { description: 'Usuário não encontrado no tenant.', content: jsonError },
      409: { description: 'E-mail já utilizado no tenant.', content: jsonError },
      429: { description: 'Limite de solicitações de código excedido.', content: jsonError },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/me/email-change/verify',
    tags: ['Auth'],
    summary: 'Confirma a alteração do e-mail do próprio usuário',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: confirmEmailChangeSchema } },
      },
    },
    responses: {
      204: { description: 'E-mail atualizado após confirmação do código.' },
      400: { description: 'Dados ou código de confirmação inválidos.', content: jsonError },
      401: { description: 'Access token ausente, inválido ou expirado.', content: jsonError },
      403: { description: 'Conta ou tenant sem acesso permitido.', content: jsonError },
      404: { description: 'Usuário não encontrado no tenant.', content: jsonError },
      409: { description: 'E-mail já utilizado no tenant.', content: jsonError },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/users/{id}/email-change',
    tags: ['Auth'],
    summary: 'Solicita a confirmação de um novo e-mail para um usuário do tenant',
    description:
      'A gestão com papel OWNER pode iniciar a alteração para outro usuário do próprio tenant, inclusive com e-mail ainda não verificado. A mudança só ocorre depois da prova enviada ao novo endereço. O próprio usuário também pode iniciar seu fluxo autenticado.',
    security: [{ bearerAuth: [] }],
    request: {
      params: userIdParamsSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: requestEmailChangeSchema } },
      },
    },
    responses: {
      204: { description: 'Solicitação processada; o e-mail atual permanece até a confirmação.' },
      400: { description: 'Dados ou parâmetro inválidos.', content: jsonError },
      401: { description: 'Access token ausente, inválido ou expirado.', content: jsonError },
      403: {
        description: 'Sem permissão de gestão para alterar outro usuário.',
        content: jsonError,
      },
      404: { description: 'Usuário não encontrado no tenant do ator.', content: jsonError },
      409: { description: 'E-mail já utilizado no tenant.', content: jsonError },
      429: {
        description: 'Intervalo mínimo entre solicitações não respeitado.',
        content: jsonError,
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/email-change/verify',
    tags: ['Auth'],
    summary: 'Confirma publicamente uma alteração de e-mail por solicitação e código',
    description:
      'Não exige sessão. O identificador opaco da solicitação não é prova suficiente: é necessário o código enviado ao novo endereço. O código expira em 10 minutos, permite até cinco tentativas inválidas e só pode ser consumido uma vez. Não ativa a conta nem aprova vínculos. A confirmação revoga todas as sessões apenas da conta alvo.',
    security: [],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: publicConfirmEmailChangeSchema } },
      },
    },
    responses: {
      204: { description: 'Novo e-mail confirmado e sessões da conta alvo invalidadas.' },
      400: {
        description: 'Dados, solicitação ou código inválidos, expirados ou já consumidos.',
        content: jsonError,
      },
      409: {
        description: 'Novo e-mail passou a ser utilizado por outra conta do mesmo tenant.',
        content: jsonError,
      },
    },
  })
}
