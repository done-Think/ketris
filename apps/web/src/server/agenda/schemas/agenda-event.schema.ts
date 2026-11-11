import { userRoleSchema } from '@server/auth/schemas/user.schema'
import { AGENDA_EVENT_OUTCOMES, AGENDA_VISIT_INTERESTS } from '@shared/lib/utils/agenda-outcome'
import '@server/openapi/zod-extend'
import { z } from 'zod'

const agendaEventLinkedUserSchema = z
  .object({ name: z.string(), email: z.string() })
  .openapi('AgendaEventLinkedUser')

const agendaEventEditableStatuses = ['CONFIRMED', 'PENDING', 'RESCHEDULE', 'CANCELLED'] as const

export const agendaEventEditableStatusSchema = z
  .enum(agendaEventEditableStatuses)
  .openapi('AgendaEventEditableStatus', {
    description: 'Status que podem ser definidos na edição. O resultado tem rota própria.',
  })

export const agendaEventOutcomeSchema = z.enum(AGENDA_EVENT_OUTCOMES).openapi('AgendaEventOutcome')

export const agendaVisitInterestSchema = z
  .enum(AGENDA_VISIT_INTERESTS)
  .openapi('AgendaVisitInterest')

export const agendaEventStatusSchema = z
  .enum([...agendaEventEditableStatuses, ...AGENDA_EVENT_OUTCOMES])
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
    audience: z.enum(['SHARED_TEAM', 'ALL_AGENTS', 'ASSIGNED_AGENT']),
    internal: z.boolean(),
    createdById: z.string().nullable(),
    createdBy: z.object({ name: z.string(), role: userRoleSchema }).nullable(),
    propertyId: z.string().nullable(),
    propertyLabel: z.string().nullable(),
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
    cancelledAt: z.string().nullable(),
    cancelledById: z.string().nullable(),
    cancellationReason: z.string().nullable(),
    outcomeRecordedAt: z.string().nullable().openapi({
      description: 'Momento em que o resultado (realizado ou não compareceu) foi registrado.',
    }),
    outcomeRecordedById: z.string().nullable(),
    outcomeRecordedBy: z.object({ name: z.string() }).nullable(),
    visitInterest: agendaVisitInterestSchema.nullable().openapi({
      description: 'Interesse do cliente, informado apenas em visitas realizadas.',
    }),
    outcomeNotes: z.string().nullable(),
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
    propertyLabel: z.string().nullable(),
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
