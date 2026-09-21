import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  createAgendaEventRequestSchema,
  listAgendaEventsQuerySchema,
  rescheduleAgendaEventRequestSchema,
  updateAgendaEventRequestSchema,
} from './schemas/agenda-event-input.schema'
import {
  agendaEventIdParamsSchema,
  agendaEventResponseSchema,
  agendaEventsResponseSchema,
} from './schemas/agenda-event.schema'

export function registerAgendaOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/agenda/events',
    tags: ['Agenda'],
    summary: 'Lista eventos de agenda do tenant autenticado num período',
    description:
      'Retorna todos os eventos do tenant cujo intervalo [start, end) cruza o período informado ' +
      '(agenda compartilhada do time — não filtra por quem criou o evento por padrão).',
    security: [{ bearerAuth: [] }],
    request: { query: listAgendaEventsQuerySchema },
    responses: {
      200: {
        description: 'Lista de eventos no período.',
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
      'Eventos do tipo VISIT exigem duração mínima de 60 minutos. O responsável não pode ter outro ' +
      'evento (não cancelado) sobreposto ao horário informado.',
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
        description: 'Corpo da requisição inválido (inclui visita com menos de 60 minutos).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Autenticado como RENTER — não pode gerenciar agenda.',
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
    summary: 'Consulta um evento de agenda do tenant autenticado',
    security: [{ bearerAuth: [] }],
    request: { params: agendaEventIdParamsSchema },
    responses: {
      200: {
        description: 'Evento encontrado.',
        content: { 'application/json': { schema: agendaEventResponseSchema } },
      },
      404: {
        description: 'Evento não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/agenda/events/{id}',
    tags: ['Agenda'],
    summary: 'Atualiza campos gerais de um evento de agenda (não altera data/hora)',
    description:
      'Para mudar data/hora, use POST /agenda/events/{id}/reschedule. Marcar kind=VISIT exige que ' +
      'o evento já tenha duração de pelo menos 60 minutos.',
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
        description: 'Corpo da requisição inválido (inclui VISIT com menos de 60 minutos).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Autenticado como RENTER — não pode gerenciar agenda.',
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
      'duração final não pode ficar abaixo de 60 minutos. O novo horário não pode colidir com ' +
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
        description: 'Corpo da requisição inválido (inclui VISIT com menos de 60 minutos).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Autenticado como RENTER — não pode gerenciar agenda.',
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
    request: { params: agendaEventIdParamsSchema },
    responses: {
      200: {
        description: 'Evento cancelado.',
        content: { 'application/json': { schema: agendaEventResponseSchema } },
      },
      403: {
        description: 'Autenticado como RENTER — não pode gerenciar agenda.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description: 'Evento não encontrado neste tenant.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}
