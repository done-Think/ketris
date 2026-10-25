import type { z } from 'zod'
import type {
  agendaEventSchema,
  renterAgendaEventSchema,
  agendaEventsResponseSchema,
  agendaEventReadResponseSchema,
} from '../schemas/agenda-event.schema'
import type {
  createAgendaEventRequestSchema,
  updateAgendaEventRequestSchema,
  rescheduleAgendaEventRequestSchema,
  listAgendaEventsQuerySchema,
} from '../schemas/agenda-event-input.schema'

export type AgendaEventResponseDTO = z.infer<typeof agendaEventSchema>
export type RenterAgendaEventResponseDTO = z.infer<typeof renterAgendaEventSchema>
export type CreateAgendaEventRequestDTO = z.infer<typeof createAgendaEventRequestSchema>
export type UpdateAgendaEventRequestDTO = z.infer<typeof updateAgendaEventRequestSchema>
export type RescheduleAgendaEventRequestDTO = z.infer<typeof rescheduleAgendaEventRequestSchema>
export type ListAgendaEventsQueryDTO = z.infer<typeof listAgendaEventsQuerySchema>
export type AgendaEventsResponseDTO = z.infer<typeof agendaEventsResponseSchema>
export type AgendaEventReadResponseDTO = z.infer<typeof agendaEventReadResponseSchema>
export type CreateAgendaEventRequestInput = z.input<typeof createAgendaEventRequestSchema>
export type UpdateAgendaEventRequestInput = z.input<typeof updateAgendaEventRequestSchema>
export type RescheduleAgendaEventRequestInput = z.input<typeof rescheduleAgendaEventRequestSchema>

export type CancelAgendaEventRequestDTO = z.infer<
  typeof import('../schemas/agenda-event-input.schema').cancelAgendaEventRequestSchema
>

export type AgendaPropertyOptionsResponseDTO = z.infer<
  typeof import('../schemas/agenda-property.schema').agendaPropertyOptionsResponseSchema
>
