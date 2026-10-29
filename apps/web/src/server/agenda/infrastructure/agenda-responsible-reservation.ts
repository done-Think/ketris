import type { Prisma } from '@prisma/client'
import type { AgendaResponsibleReservation } from '../types/reservation'
import { AgendaEventConflictError } from '../domain/errors'

export async function assertResponsibleReservation(
  transaction: Prisma.TransactionClient,
  event: AgendaResponsibleReservation,
) {
  if (event.status === 'CANCELLED') return
  const key = `agenda-responsible:${event.tenantId}:${event.responsibleId}`
  await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`
  const conflict = await transaction.agendaEvent.findFirst({
    where: {
      tenantId: event.tenantId,
      responsibleId: event.responsibleId,
      status: { not: 'CANCELLED' },
      id: event.id ? { not: event.id } : undefined,
      start: { lt: event.end },
      end: { gt: event.start },
    },
    select: { id: true },
  })
  if (conflict) throw new AgendaEventConflictError()
}
