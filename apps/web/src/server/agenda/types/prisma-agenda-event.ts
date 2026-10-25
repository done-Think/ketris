import type { Prisma } from '@prisma/client'
import type { agendaEventInclude } from '../infrastructure/agenda-event-query'

export type EventoAgendaWithLinks = Prisma.EventoAgendaGetPayload<{
  include: typeof agendaEventInclude
}>
