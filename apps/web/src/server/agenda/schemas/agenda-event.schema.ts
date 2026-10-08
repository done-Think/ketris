import '@server/openapi/zod-extend'
import { z } from 'zod'

import type { AgendaEvent } from '../domain/agenda-event.entity'

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
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('AgendaEvent')

export const agendaEventIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const agendaEventResponseSchema = z
  .object({ event: agendaEventSchema })
  .openapi('AgendaEventResponse')

export const agendaEventsResponseSchema = z
  .object({ events: z.array(agendaEventSchema) })
  .openapi('AgendaEventsResponse')

export type AgendaEventResponseDTO = z.infer<typeof agendaEventSchema>

export function toAgendaEventResponse(event: AgendaEvent): AgendaEventResponseDTO {
  return {
    id: event.id,
    tenantId: event.tenantId,
    responsibleId: event.responsavelId,
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
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }
}
