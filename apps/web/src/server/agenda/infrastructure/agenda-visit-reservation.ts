import type { Prisma } from '@prisma/client'
import type { AgendaPropertyReservation } from '../types/reservation'
import { AGENDA_MINIMUM_VISIT_MINUTES } from '@shared/lib/utils/agenda-scheduling'
import { AgendaPropertyVisitConflictError, AgendaVisitMinimumDurationError } from '../domain/errors'

export async function lockAgendaEvent(
  transaction: Prisma.TransactionClient,
  tenantId: string,
  id: string,
) {
  await transaction.$queryRaw`SELECT "id" FROM "agenda_events" WHERE "tenantId" = ${tenantId} AND "id" = ${id} FOR UPDATE`
}

export async function assertVisitReservation(
  transaction: Prisma.TransactionClient,
  event: AgendaPropertyReservation,
): Promise<void> {
  if (event.type !== 'VISIT' || event.status === 'CANCELLED') return
  if (event.end.getTime() - event.start.getTime() < AGENDA_MINIMUM_VISIT_MINUTES * 60000)
    throw new AgendaVisitMinimumDurationError()
  if (!event.propertyId) return

  const key = `agenda-visit:${event.tenantId}:${event.propertyId}`
  await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`
  const conflict = await transaction.agendaEvent.findFirst({
    where: {
      tenantId: event.tenantId,
      propertyId: event.propertyId,
      type: 'VISIT',
      status: { not: 'CANCELLED' },
      id: event.id ? { not: event.id } : undefined,
      start: { lt: event.end },
      OR: [
        { end: { gt: event.start } },
        { start: { gt: new Date(event.start.getTime() - AGENDA_MINIMUM_VISIT_MINUTES * 60000) } },
      ],
    },
    select: { id: true },
  })
  if (conflict) throw new AgendaPropertyVisitConflictError()
}
