import type { OpenAPIRegistry, RouteConfig } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  acceptTeamInvitationRequestSchema,
  deactivateBrokerRequestSchema,
  inviteBrokerRequestSchema,
  inviteBrokerResponseSchema,
  resendTeamInvitationRequestSchema,
  setBrokerGoalRequestSchema,
  teamGoalChangeSchema,
  teamInvitationPreviewSchema,
  teamInvitationTokenQuerySchema,
  teamMemberIdParamsSchema,
  teamOverviewResponseSchema,
  teamTransferResponseSchema,
  transferBrokerPortfolioRequestSchema,
} from './schemas/team.schema'

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
})

const managerErrors = {
  401: error('Access token ausente, inválido ou expirado.'),
  403: error('Só o dono da imobiliária (OWNER) gerencia a equipe.'),
}

const json = <T extends z.ZodTypeAny>(schema: T) => ({
  content: { 'application/json': { schema } },
})

function managerRoute(config: Omit<RouteConfig, 'tags' | 'security'>): RouteConfig {
  return {
    ...config,
    tags: ['Team'],
    security: [{ bearerAuth: [] }],
    responses: { ...managerErrors, ...config.responses },
  }
}

export function registerTeamOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath(
    managerRoute({
      method: 'get',
      path: '/team',
      summary: 'Equipe de corretores com os números do mês',
      description:
        'Vendas = contratos ativados no mês nos imóveis do corretor. Leads = em aberto (não convertidos). Retornos = contatos registrados nas oportunidades no mês. Tempo de resposta = mediana dos últimos 30 dias (leads e oportunidades). O status compara as vendas com o ritmo esperado da meta.',
      responses: { 200: { description: 'Equipe.', ...json(teamOverviewResponseSchema) } },
    }),
  )
  registry.registerPath(
    managerRoute({
      method: 'get',
      path: '/team/members/{id}/goal',
      summary: 'Histórico de metas do corretor (mais recente primeiro)',
      request: { params: teamMemberIdParamsSchema },
      responses: {
        200: {
          description: 'Histórico.',
          ...json(z.object({ goals: z.array(teamGoalChangeSchema) })),
        },
        404: error('Corretor não encontrado.'),
      },
    }),
  )
  registry.registerPath(
    managerRoute({
      method: 'put',
      path: '/team/members/{id}/goal',
      summary: 'Define a meta mensal de vendas do corretor (vale até mudar)',
      request: { params: teamMemberIdParamsSchema, body: json(setBrokerGoalRequestSchema) },
      responses: {
        200: { description: 'Meta gravada.', ...json(z.object({ goal: teamGoalChangeSchema })) },
        400: error('Corpo inválido.'),
        404: error('Corretor não encontrado.'),
      },
    }),
  )
  registry.registerPath(
    managerRoute({
      method: 'post',
      path: '/team/members/{id}/transfer',
      summary:
        'Transfere imóveis (com as oportunidades), leads e eventos futuros para outro corretor',
      request: {
        params: teamMemberIdParamsSchema,
        body: json(transferBrokerPortfolioRequestSchema),
      },
      responses: {
        200: {
          description: 'Quantidades transferidas.',
          ...json(z.object({ transferred: teamTransferResponseSchema })),
        },
        404: error('Corretor não encontrado.'),
        422: error('Destino inválido ou nenhum item escolhido.'),
      },
    }),
  )
  registry.registerPath(
    managerRoute({
      method: 'post',
      path: '/team/members/{id}/deactivate',
      summary: 'Desativa o corretor transferindo toda a carteira para outro corretor',
      request: { params: teamMemberIdParamsSchema, body: json(deactivateBrokerRequestSchema) },
      responses: {
        200: {
          description: 'Corretor desativado; quantidades transferidas.',
          ...json(z.object({ transferred: teamTransferResponseSchema })),
        },
        404: error('Corretor não encontrado ou já inativo.'),
        422: error('Destino inválido ou tentativa de desativar a própria conta.'),
      },
    }),
  )
  registry.registerPath(
    managerRoute({
      method: 'post',
      path: '/team/members/{id}/activate',
      summary: 'Reativa um corretor',
      request: { params: teamMemberIdParamsSchema },
      responses: { 204: { description: 'Reativado.' }, 404: error('Corretor não encontrado.') },
    }),
  )
  registry.registerPath(
    managerRoute({
      method: 'post',
      path: '/team/invitations',
      summary: 'Convida um corretor por e-mail (link de uso único, válido por 7 dias)',
      request: { body: json(inviteBrokerRequestSchema) },
      responses: {
        201: { description: 'Convite criado.', ...json(inviteBrokerResponseSchema) },
        400: error('Corpo inválido.'),
        409: error('E-mail já usado nesta imobiliária.'),
      },
    }),
  )
  registry.registerPath(
    managerRoute({
      method: 'post',
      path: '/team/invitations/{id}/resend',
      summary: 'Reenvia o convite; o link anterior deixa de valer',
      request: { params: teamMemberIdParamsSchema, body: json(resendTeamInvitationRequestSchema) },
      responses: {
        200: {
          description: 'Convite reenviado.',
          ...json(z.object({ emailDelivered: z.boolean() })),
        },
        404: error('Convite pendente não encontrado.'),
      },
    }),
  )
  registry.registerPath(
    managerRoute({
      method: 'delete',
      path: '/team/invitations/{id}',
      summary: 'Cancela um convite pendente',
      request: { params: teamMemberIdParamsSchema },
      responses: {
        204: { description: 'Convite cancelado.' },
        404: error('Convite pendente não encontrado.'),
        409: error('O convidado já tem imóveis, leads ou eventos.'),
      },
    }),
  )
  registry.registerPath({
    method: 'get',
    path: '/team/invitations/accept',
    tags: ['Team'],
    summary: 'Consulta um convite pelo token (público)',
    request: { query: teamInvitationTokenQuerySchema },
    responses: {
      200: {
        description: 'Convite.',
        ...json(z.object({ invitation: teamInvitationPreviewSchema })),
      },
      404: error('Convite não encontrado.'),
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/team/invitations/accept',
    tags: ['Team'],
    summary: 'Aceita o convite definindo a senha (público, uso único)',
    request: { body: json(acceptTeamInvitationRequestSchema) },
    responses: {
      200: { description: 'Senha definida.', ...json(z.object({ email: z.string() })) },
      400: error('Corpo inválido.'),
      404: error('Convite não encontrado.'),
      409: error('Convite já usado.'),
      410: error('Convite expirado.'),
    },
  })
}
