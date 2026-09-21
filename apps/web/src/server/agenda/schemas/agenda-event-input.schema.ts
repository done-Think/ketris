import '@server/openapi/zod-extend'
import { z } from 'zod'

import { agendaEventKindSchema, agendaEventStatusSchema } from './agenda-event.schema'

const durationMinutesSchema = z.number().int().min(15, 'Informe ao menos 15 minutos.')

export const createAgendaEventRequestSchema = z
  .object({
    responsibleId: z.string().trim().min(1).optional(),
    propertyId: z.string().trim().min(1).optional(),
    propertyReference: z.string().trim().min(1).optional(),
    title: z.string().trim().min(3, 'Informe o título do evento.'),
    kind: agendaEventKindSchema.optional(),
    start: z.coerce.date({ message: 'Informe a data/hora de início.' }),
    durationMinutes: durationMinutesSchema,
    participantName: z.string().trim().min(2, 'Informe o nome do participante.'),
    participantPhone: z.string().trim().min(1, 'Informe o telefone do participante.'),
    notes: z.string().trim().optional(),
  })
  .refine((value) => Boolean(value.propertyId || value.propertyReference), {
    message: 'Informe o imóvel ou uma referência.',
    path: ['propertyReference'],
  })
  .refine((value) => value.kind !== 'VISIT' || value.durationMinutes >= 60, {
    message: 'Visitas devem ter duração mínima de 60 minutos.',
    path: ['durationMinutes'],
  })
  .openapi('CreateAgendaEventRequest')

export const updateAgendaEventRequestSchema = z
  .object({
    title: z.string().trim().min(3, 'Informe o título do evento.').optional(),
    kind: agendaEventKindSchema.nullable().optional(),
    status: agendaEventStatusSchema.optional(),
    propertyId: z.string().trim().min(1).nullable().optional(),
    propertyReference: z.string().trim().min(1).nullable().optional(),
    participantName: z.string().trim().min(2).optional(),
    participantPhone: z.string().trim().min(1).optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Informe ao menos um campo para atualização.',
  })
  .openapi('UpdateAgendaEventRequest')

export const rescheduleAgendaEventRequestSchema = z
  .object({
    start: z.coerce.date({ message: 'Informe a nova data/hora de início.' }),
    durationMinutes: durationMinutesSchema.optional(),
  })
  .openapi('RescheduleAgendaEventRequest')

export const listAgendaEventsQuerySchema = z
  .object({
    from: z.coerce.date({ message: 'Informe o início do período (from).' }),
    to: z.coerce.date({ message: 'Informe o fim do período (to).' }),
    responsibleId: z.string().trim().min(1).optional(),
  })
  .openapi('ListAgendaEventsQuery')

export type CreateAgendaEventRequestDTO = z.infer<typeof createAgendaEventRequestSchema>
export type UpdateAgendaEventRequestDTO = z.infer<typeof updateAgendaEventRequestSchema>
export type RescheduleAgendaEventRequestDTO = z.infer<typeof rescheduleAgendaEventRequestSchema>
export type ListAgendaEventsQueryDTO = z.infer<typeof listAgendaEventsQuerySchema>
