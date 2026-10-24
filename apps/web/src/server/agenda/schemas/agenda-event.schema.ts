import '@server/openapi/zod-extend'
import { z } from 'zod'

import type { Papel } from '@server/auth/domain/user.entity'

import type { AgendaEvent, AgendaEventLinkedUser } from '../domain/agenda-event.entity'

const agendaEventLinkedUserSchema = z
  .object({ name: z.string(), email: z.string() })
  .openapi('AgendaEventLinkedUser')

export const agendaEventStatusSchema = z
  .enum(['CONFIRMED', 'PENDING', 'RESCHEDULE', 'CANCELLED'])
  .openapi('AgendaEventStatus')

export const agendaEventKindSchema = z
  .enum(['VISIT', 'FOLLOW_UP', 'MEETING', 'INSPECTION', 'SIGNATURE', 'OTHER'])
  .openapi('AgendaEventKind')

export const agendaEventSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    responsibleId: z.string().openapi({ description: 'ID do usuário responsável pelo evento.' }),
    responsibleName: z.string(),
    audience: z.enum(['LEGACY_TEAM', 'ALL_AGENTS', 'ASSIGNED_AGENT']),
    internal: z.boolean(),
    createdById: z.string().nullable(),
    propertyId: z.string().nullable(),
    propertyReference: z
      .string()
      .nullable()
      .openapi({ description: 'Referência livre de imóvel, usada quando propertyId é nulo.' }),
    title: z.string(),
    kind: agendaEventKindSchema.nullable(),
    status: agendaEventStatusSchema,
    start: z.string().openapi({ description: 'Início do evento (ISO 8601).' }),
    end: z.string().openapi({ description: 'Término do evento (ISO 8601).' }),
    participantName: z.string(),
    participantPhone: z.string(),
    notes: z.string().nullable(),
    owner: agendaEventLinkedUserSchema.nullable().openapi({
      description: 'Dono explícito do evento (acesso de leitura).',
    }),
    participants: z.array(agendaEventLinkedUserSchema).openapi({
      description: 'Usuários participantes vinculados (acesso de leitura).',
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('AgendaEvent')

export const renterAgendaEventSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    kind: agendaEventKindSchema.nullable(),
    status: agendaEventStatusSchema,
    start: z.string().openapi({ description: 'Início do evento (ISO 8601).' }),
    end: z.string().openapi({ description: 'Término do evento (ISO 8601).' }),
    propertyId: z.string().nullable(),
    propertyReference: z.string().nullable(),
    responsibleName: z.string().openapi({ description: 'Nome do responsável pelo evento.' }),
  })
  .openapi('RenterAgendaEvent', {
    description:
      'Visão reduzida retornada ao RENTER: sem notas, contato do participante, e-mails ou IDs ' +
      'internos de usuários e do tenant.',
  })

const agendaEventReadSchema = z.union([agendaEventSchema, renterAgendaEventSchema])

export const agendaEventIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const agendaEventResponseSchema = z
  .object({ event: agendaEventSchema })
  .openapi('AgendaEventResponse')

export const agendaEventReadResponseSchema = z
  .object({ event: agendaEventReadSchema })
  .openapi('AgendaEventReadResponse')

export const agendaEventsResponseSchema = z
  .object({ events: z.array(agendaEventReadSchema) })
  .openapi('AgendaEventsResponse')

export type AgendaEventResponseDTO = z.infer<typeof agendaEventSchema>
export type RenterAgendaEventResponseDTO = z.infer<typeof renterAgendaEventSchema>

export function toAgendaEventResponse(event: AgendaEvent): AgendaEventResponseDTO {
  return {
    id: event.id,
    tenantId: event.tenantId,
    responsibleId: event.responsavelId,
    responsibleName: event.responsavelNome,
    audience: event.destino ?? 'LEGACY_TEAM',
    internal: event.interno ?? false,
    createdById: event.criadoPorId,
    propertyId: event.imovelId,
    propertyReference: event.referenciaImovelLivre,
    title: event.titulo,
    kind: event.tipo,
    status: event.status,
    start: event.inicio.toISOString(),
    end: event.fim.toISOString(),
    participantName: event.participanteNome,
    participantPhone: event.participanteTelefone,
    notes: event.notas,
    owner: event.dono ? toLinkedUserResponse(event.dono) : null,
    participants: event.participantes.map(toLinkedUserResponse),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }
}

export function toRenterAgendaEventResponse(event: AgendaEvent): RenterAgendaEventResponseDTO {
  return {
    id: event.id,
    title: event.titulo,
    kind: event.tipo,
    status: event.status,
    start: event.inicio.toISOString(),
    end: event.fim.toISOString(),
    propertyId: event.imovelId,
    propertyReference: event.referenciaImovelLivre,
    responsibleName: event.responsavelNome,
  }
}

/** A RENTER reads the reduced view, except for the events it created itself. */
export function toAgendaEventReadResponse(
  event: AgendaEvent,
  actorPapel: Papel,
  actorUserId: string,
): AgendaEventResponseDTO | RenterAgendaEventResponseDTO {
  return actorPapel === 'RENTER' && event.criadoPorId !== actorUserId
    ? toRenterAgendaEventResponse(event)
    : toAgendaEventResponse(event)
}

function toLinkedUserResponse(user: AgendaEventLinkedUser) {
  return { name: user.nome, email: user.email }
}
