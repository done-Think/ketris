import type { Prisma } from '@prisma/client'
import type { agendaEventInclude } from '../infrastructure/agenda-event-query'

export type AgendaEventWithLinks = Prisma.AgendaEventGetPayload<{
  include: typeof agendaEventInclude
}>
