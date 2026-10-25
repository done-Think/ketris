import {
  agendaPropertyOptionsResponseSchema,
  listAgendaPropertiesQuerySchema,
} from './schemas/agenda-property.schema'
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  createAgendaEventRequestSchema,
  cancelAgendaEventRequestSchema,
  listAgendaEventsQuerySchema,
  rescheduleAgendaEventRequestSchema,
  updateAgendaEventRequestSchema,
} from './schemas/agenda-event-input.schema'
import {
  agendaEventIdParamsSchema,
  agendaEventReadResponseSchema,
  agendaEventResponseSchema,
  agendaEventsResponseSchema,
} from './schemas/agenda-event.schema'

export function registerAgendaOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/agenda/properties',
    tags: ['Agenda'],
    summary: 'Busca imóveis autorizados para agendamento, com paginação',
    description:
      'Retorna apenas ID e rótulo. OWNER consulta imóveis do tenant; AGENT, os sob sua responsabilidade; PROPERTY_OWNER, os de sua propriedade; RENTER, os vinculados aos seus contratos ativos.',
    security: [{ bearerAuth: [] }],
    request: { query: listAgendaPropertiesQuerySchema },
    responses: {
      200: {
        description: 'Página de imóveis autorizados.',
        content: { 'application/json': { schema: agendaPropertyOptionsResponseSchema } },
      },
      400: {
        description: 'Parâmetros inválidos.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Autenticação necessária.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/agenda/events',
    tags: ['Agenda'],
    summary: 'Lista eventos de agenda visíveis ao usuário autenticado num período',
    description:
      'OWNER: retorna todos os eventos do tenant. AGENT: eventos coletivos e os direcionados ao próprio corretor. ' +
      'PROPERTY_OWNER: eventos não internos vinculados ao usuário ou aos seus imóveis. Eventos legados mantêm o compartilhamento anterior. ' +
      'O intervalo [start, end) deve cruzar o período informado. RENTER: retorna somente eventos não internos em ' +
      'que ele é o dono explícito ou participante vinculado, combinados com os filtros de período ' +
      'e responsibleId, na visão reduzida RenterAgendaEvent (sem notas, contato do participante, ' +
      'e-mails ou IDs internos).',
    security: [{ bearerAuth: [] }],
    request: { query: listAgendaEventsQuerySchema.innerType() },
    responses: {
      200: {
        description:
          'Lista de eventos no período (AgendaEvent para a equipe, RenterAgendaEvent para RENTER).',
        content: { 'application/json': { schema: agendaEventsResponseSchema } },
      },
      400: {
        description: 'Parâmetros de período inválidos.',
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
    path: '/agenda/events',
    tags: ['Agenda'],
    summary: 'Cria um evento de agenda para o tenant autenticado',
    description:
      'responsibleId é opcional — quando omitido, o evento é atribuído a quem está autenticado. ' +
      'Informe propertyId (imóvel existente no tenant) ou propertyReference (referência livre). ' +
      'Eventos do tipo VISIT exigem duração mínima de 30 minutos e reservam o imóvel vinculado pelo ID durante todo o período, inclusive entre corretores diferentes. ' +
      'Fora de 08:00–18:00 (America/Sao_Paulo), o período inteiro exige outsideBusinessHoursConfirmed=true após confirmação do aviso. ' +
      'O responsável não pode ter outro ' +
      'evento (não cancelado) sobreposto ao horário informado. ownerEmail e participantEmails ' +
      '(opcionais) vinculam usuários com acesso de leitura: RENTER ativo (inclusive do tenant ' +
      'compartilhado de locatários) ou membro ativo do tenant do evento. Evento e vínculos são ' +
      'gravados atomicamente.',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createAgendaEventRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Evento criado.',
        content: { 'application/json': { schema: agendaEventResponseSchema } },
      },
      400: {
        description:
          'Corpo da requisição inválido (inclui visita com menos de 30 minutos) ou e-mail que não ' +
          'pode ser vinculado (AGENDA_EVENT_USER_LINK_UNAVAILABLE — mesma resposta para qualquer ' +
          'motivo).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description:
          'Sem permissão para alterar este evento. O RENTER pode gerenciar os eventos que criou, conforme as regras de acesso.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'propertyId ou responsibleId informado não existe neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'O responsável já tem outro evento agendado nesse horário.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/agenda/events/{id}',
    tags: ['Agenda'],
    summary: 'Consulta um evento de agenda visível ao usuário autenticado',
    description:
      'ADMIN/OWNER/AGENT consultam eventos do próprio tenant. RENTER consulta somente eventos em ' +
      'que é dono explícito ou participante vinculado, na visão reduzida RenterAgendaEvent.',
    security: [{ bearerAuth: [] }],
    request: { params: agendaEventIdParamsSchema },
    responses: {
      200: {
        description: 'Evento encontrado.',
        content: { 'application/json': { schema: agendaEventReadResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description:
          'Evento inexistente, de outro tenant ou (para RENTER) sem vínculo com o usuário — a ' +
          'mesma resposta em todos os casos, para não permitir enumerar IDs.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/agenda/events/{id}',
    tags: ['Agenda'],
    summary: 'Atualiza os dados e o horário de um evento de agenda',
    description:
      'Dados, destinatarios e periodo podem ser atualizados juntos. Para alterar o periodo, informe start e durationMinutes. Marcar kind=VISIT exige que ' +
      'o evento já tenha duração de pelo menos 30 minutos. ownerEmail: omitido mantém, null ' +
      'remove, e-mail troca o dono. participantEmails: omitido mantém, [] remove todos, lista ' +
      'substitui. Alterações e vínculos são gravados atomicamente.',
    security: [{ bearerAuth: [] }],
    request: {
      params: agendaEventIdParamsSchema,
      body: { content: { 'application/json': { schema: updateAgendaEventRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Evento atualizado.',
        content: { 'application/json': { schema: agendaEventResponseSchema } },
      },
      400: {
        description:
          'Corpo da requisição inválido (inclui VISIT com menos de 30 minutos) ou e-mail que não ' +
          'pode ser vinculado (AGENDA_EVENT_USER_LINK_UNAVAILABLE).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description:
          'Sem permissão para alterar este evento. O RENTER pode gerenciar os eventos que criou, conforme as regras de acesso.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Evento ou propertyId não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/agenda/events/{id}/reschedule',
    tags: ['Agenda'],
    summary: 'Reagenda um evento (nova data/hora), marcando-o como CONFIRMED',
    description:
      'Sem durationMinutes, mantém a duração atual do evento. Se o evento for do tipo VISIT, a ' +
      'duração final não pode ficar abaixo de 30 minutos. Períodos fora de 08:00–18:00 exigem outsideBusinessHoursConfirmed=true. O novo horário não pode colidir com ' +
      'outro evento (não cancelado) do mesmo responsável.',
    security: [{ bearerAuth: [] }],
    request: {
      params: agendaEventIdParamsSchema,
      body: { content: { 'application/json': { schema: rescheduleAgendaEventRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Evento reagendado.',
        content: { 'application/json': { schema: agendaEventResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido (inclui VISIT com menos de 30 minutos).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description:
          'Sem permissão para alterar este evento. O RENTER pode gerenciar os eventos que criou, conforme as regras de acesso.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Evento não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'O responsável já tem outro evento agendado nesse horário.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/agenda/events/{id}/cancel',
    tags: ['Agenda'],
    summary: 'Cancela um evento de agenda (soft — status vira CANCELLED)',
    security: [{ bearerAuth: [] }],
    request: {
      params: agendaEventIdParamsSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: cancelAgendaEventRequestSchema } },
      },
    },
    responses: {
      400: {
        description: 'Informe um motivo de cancelamento válido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      200: {
        description: 'Evento cancelado com motivo, autor e data registrados.',
        content: { 'application/json': { schema: agendaEventResponseSchema } },
      },
      403: {
        description:
          'Sem permissão para alterar este evento. O RENTER pode gerenciar os eventos que criou, conforme as regras de acesso.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Evento não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
