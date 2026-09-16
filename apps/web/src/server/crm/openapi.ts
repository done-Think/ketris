import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  activityResponseSchema,
  createActivityRequestSchema,
  listActivitiesResponseSchema,
} from './schemas/activity.schema'
import {
  contactResponseSchema,
  createContactRequestSchema,
  listContactsQuerySchema,
  listContactsResponseSchema,
  patchContactRequestSchema,
} from './schemas/contact.schema'
import {
  createOpportunityRequestSchema,
  listOpportunitiesQuerySchema,
  listOpportunitiesResponseSchema,
  opportunityResponseSchema,
  patchOpportunityRequestSchema,
  putOpportunityRequestSchema,
  deleteOpportunityQuerySchema,
} from './schemas/opportunity.schema'
import {
  respondOpportunityRequestSchema,
  respondOpportunityResponseSchema,
} from './schemas/respond-opportunity.schema'

const opportunityIdParamsSchema = z.object({
  id: z.string().openapi({
    description: 'ID da oportunidade.',
    example: 'clx1y2z3a0000abcd1234efgh',
  }),
})

const contactIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'ID do contato.', example: 'clx1y2z3a0000abcd1234efgh' }),
})

export function registerCrmOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/crm/opportunities',
    tags: ['CRM'],
    summary: 'Lista as oportunidades do tenant autenticado',
    description:
      'Requer autenticação (Bearer). Retorna apenas as oportunidades do próprio tenant do ator. Por ' +
      'padrão exclui as arquivadas (soft delete); use includeArchived=true para incluí-las. Filtra ' +
      'por status e/ou por contato vinculado. Quando o ator tem papel AGENT, a listagem é restrita ' +
      'às oportunidades de imóveis dos quais o ator é responsável; ADMIN e OWNER veem todo o tenant.',
    security: [{ bearerAuth: [] }],
    request: { query: listOpportunitiesQuerySchema },
    responses: {
      200: {
        description: 'Lista de oportunidades do tenant.',
        content: { 'application/json': { schema: listOpportunitiesResponseSchema } },
      },
      400: {
        description: 'Parâmetros de busca inválidos (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/crm/opportunities',
    tags: ['CRM'],
    summary: 'Cria uma oportunidade manualmente',
    description:
      'Requer autenticação (Bearer). Para leads que chegam fora do formulário público do marketplace ' +
      '(ex.: telefone, WhatsApp). `imovelId` precisa pertencer ao tenant do ator (404 caso contrário); ' +
      'se `contatoId` for informado, também precisa pertencer ao tenant. Nasce em RASCUNHO por padrão ' +
      '(prospecção) — pode nascer em ENVIADA quando o corretor está registrando uma proposta já feita ' +
      'fora do sistema. Não aceita ACEITA/EM_NEGOCIACAO/RECUSADA como estado inicial: essas transições ' +
      'só acontecem através da timeline (PATCH ou /respond). Um ator com papel AGENT só pode criar ' +
      'oportunidades em imóveis dos quais é responsável (403 caso contrário); ADMIN e OWNER podem ' +
      'usar qualquer imóvel do tenant.',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createOpportunityRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Oportunidade criada.',
        content: { 'application/json': { schema: opportunityResponseSchema } },
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
        description: 'Ator com papel AGENT tentando criar em um imóvel do qual não é responsável.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Imóvel ou contato informado não pertence a este tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/crm/opportunities/{id}',
    tags: ['CRM'],
    summary: 'Consulta uma oportunidade do tenant autenticado',
    description:
      'Requer autenticação (Bearer). Uma oportunidade de outro tenant responde 404 (opaco), igual a ' +
      'um id inexistente — nunca revela se o registro existe em outro tenant. O mesmo 404 opaco vale ' +
      'para um ator AGENT consultando uma oportunidade de imóvel do qual não é responsável.',
    security: [{ bearerAuth: [] }],
    request: { params: opportunityIdParamsSchema },
    responses: {
      200: {
        description: 'Oportunidade encontrada.',
        content: { 'application/json': { schema: opportunityResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Oportunidade não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'put',
    path: '/crm/opportunities/{id}',
    tags: ['CRM'],
    summary: 'Substitui (atualização completa) uma oportunidade',
    description:
      'Requer autenticação (Bearer). Semântica de representação total: os campos-núcleo são ' +
      'obrigatórios e os opcionais omitidos são redefinidos para o valor padrão. A mudança de status ' +
      'é validada pela máquina de estados do funil — uma transição inválida (ex.: reabrir uma ' +
      'oportunidade ACEITA) responde 409.',
    security: [{ bearerAuth: [] }],
    request: {
      params: opportunityIdParamsSchema,
      body: { content: { 'application/json': { schema: putOpportunityRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Oportunidade atualizada.',
        content: { 'application/json': { schema: opportunityResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Oportunidade não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Transição de status inválida para o funil.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/crm/opportunities/{id}',
    tags: ['CRM'],
    summary: 'Atualiza parcialmente uma oportunidade',
    description:
      'Requer autenticação (Bearer). Atualiza apenas os campos informados; ao menos um campo deve ' +
      'ser enviado. Mesma validação de transição de status do PUT.',
    security: [{ bearerAuth: [] }],
    request: {
      params: opportunityIdParamsSchema,
      body: { content: { 'application/json': { schema: patchOpportunityRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Oportunidade atualizada.',
        content: { 'application/json': { schema: opportunityResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Oportunidade não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Transição de status inválida para o funil.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/crm/opportunities/{id}',
    tags: ['CRM'],
    summary: 'Arquiva (soft delete) ou exclui permanentemente uma oportunidade',
    description:
      'Requer autenticação (Bearer). Por padrão faz soft delete (marca arquivadaEm e retorna a ' +
      'oportunidade arquivada, 200). Com permanent=true, remove o registro do banco definitivamente ' +
      '(204).',
    security: [{ bearerAuth: [] }],
    request: { params: opportunityIdParamsSchema, query: deleteOpportunityQuerySchema },
    responses: {
      200: {
        description: 'Oportunidade arquivada (soft delete).',
        content: { 'application/json': { schema: opportunityResponseSchema } },
      },
      204: {
        description: 'Oportunidade excluída permanentemente (permanent=true).',
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Oportunidade não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/crm/opportunities/{id}/respond',
    tags: ['CRM'],
    summary: 'Responde a uma proposta: aceitar, recusar ou pedir mais informações',
    description:
      'Requer autenticação (Bearer). É a decisão do corretor sobre a proposta recebida — só uma ' +
      'oportunidade em ENVIADA, EM_NEGOCIACAO ou RECUSADA pode ser respondida (RASCUNHO ainda não foi ' +
      'enviada; ACEITA já teve desfecho e é pré-requisito para o Contrato). A resposta é registrada ' +
      'na timeline da oportunidade como uma atividade PROPOSTA_RESPONDIDA.',
    security: [{ bearerAuth: [] }],
    request: {
      params: opportunityIdParamsSchema,
      body: { content: { 'application/json': { schema: respondOpportunityRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Oportunidade respondida — novo status e a atividade registrada na timeline.',
        content: { 'application/json': { schema: respondOpportunityResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Oportunidade não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description:
          'A oportunidade não está num status respondível (ex.: já ACEITA, ou ainda RASCUNHO).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/crm/opportunities/{id}/activities',
    tags: ['CRM'],
    summary: 'Lista a timeline de atividades de uma oportunidade',
    description:
      'Requer autenticação (Bearer). Ordem mais recente primeiro. Inclui notas manuais, mudanças de ' +
      'status e respostas a propostas.',
    security: [{ bearerAuth: [] }],
    request: { params: opportunityIdParamsSchema },
    responses: {
      200: {
        description: 'Timeline da oportunidade.',
        content: { 'application/json': { schema: listActivitiesResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Oportunidade não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/crm/opportunities/{id}/activities',
    tags: ['CRM'],
    summary: 'Adiciona uma nota manual à timeline da oportunidade',
    description: 'Requer autenticação (Bearer).',
    security: [{ bearerAuth: [] }],
    request: {
      params: opportunityIdParamsSchema,
      body: { content: { 'application/json': { schema: createActivityRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Nota registrada na timeline.',
        content: { 'application/json': { schema: activityResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Oportunidade não encontrada neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/crm/contacts',
    tags: ['CRM'],
    summary: 'Lista os contatos do tenant autenticado',
    description:
      'Requer autenticação (Bearer). Cada contato traz `propertyCount`: quantas oportunidades ativas ' +
      'estão vinculadas a ele (contagem sempre do tenant inteiro, não recortada por corretor). Aceita ' +
      'filtro por tipo e busca textual por nome/e-mail. Quando o ator tem papel AGENT, a listagem é ' +
      'restrita aos contatos com pelo menos uma oportunidade em imóvel do qual o ator é responsável; ' +
      'ADMIN e OWNER veem todo o tenant.',
    security: [{ bearerAuth: [] }],
    request: { query: listContactsQuerySchema },
    responses: {
      200: {
        description: 'Lista de contatos do tenant.',
        content: { 'application/json': { schema: listContactsResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/crm/contacts',
    tags: ['CRM'],
    summary: 'Cria um contato no tenant autenticado',
    description:
      'Requer autenticação (Bearer). E-mail é único por tenant — tentar criar com um e-mail já ' +
      'usado responde 409.',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: createContactRequestSchema } } } },
    responses: {
      201: {
        description: 'Contato criado.',
        content: { 'application/json': { schema: contactResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Já existe um contato com este e-mail neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/crm/contacts/{id}',
    tags: ['CRM'],
    summary: 'Consulta um contato do tenant autenticado',
    description:
      'Requer autenticação (Bearer). Um ator AGENT recebe 404 opaco para um contato sem nenhuma ' +
      'oportunidade em imóvel do qual é responsável.',
    security: [{ bearerAuth: [] }],
    request: { params: contactIdParamsSchema },
    responses: {
      200: {
        description: 'Contato encontrado.',
        content: { 'application/json': { schema: contactResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Contato não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/crm/contacts/{id}',
    tags: ['CRM'],
    summary: 'Atualiza parcialmente um contato',
    description:
      'Requer autenticação (Bearer). Atualiza apenas os campos informados; ao menos um campo deve ' +
      'ser enviado. Trocar o e-mail para um já usado por outro contato do mesmo tenant responde 409.',
    security: [{ bearerAuth: [] }],
    request: {
      params: contactIdParamsSchema,
      body: { content: { 'application/json': { schema: patchContactRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Contato atualizado.',
        content: { 'application/json': { schema: contactResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (falha de validação Zod).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Contato não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Já existe outro contato com este e-mail neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/crm/contacts/{id}',
    tags: ['CRM'],
    summary: 'Arquiva (soft delete) um contato',
    description:
      'Requer autenticação (Bearer). Contato arquivado some das listagens padrão, mas suas ' +
      'oportunidades vinculadas continuam intactas.',
    security: [{ bearerAuth: [] }],
    request: { params: contactIdParamsSchema },
    responses: {
      200: {
        description: 'Contato arquivado.',
        content: { 'application/json': { schema: contactResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Contato não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
