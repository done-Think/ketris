import type { Prisma } from '@prisma/client'
import type { AgendaPropertyReservation } from '../types/reservation'
import { AGENDA_MINIMUM_VISIT_MINUTES } from '@shared/lib/utils/agenda-scheduling'
import { AgendaPropertyVisitConflictError, AgendaVisitMinimumDurationError } from '../domain/errors'

export async function lockAgendaEvent(
  transaction: Prisma.TransactionClient,
  tenantId: string,
  id: string,
) {
  await transaction.$queryRaw`SELECT "id" FROM "eventos_agenda" WHERE "tenantId" = ${tenantId} AND "id" = ${id} FOR UPDATE`
}

export async function assertVisitReservation(
  transaction: Prisma.TransactionClient,
  event: AgendaPropertyReservation,
): Promise<void> {
  if (event.tipo !== 'VISIT' || event.status === 'CANCELLED') return
  if (event.fim.getTime() - event.inicio.getTime() < AGENDA_MINIMUM_VISIT_MINUTES * 60000)
    throw new AgendaVisitMinimumDurationError()
  if (!event.imovelId) return

  const key = `agenda-visit:${event.tenantId}:${event.imovelId}`
  await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`
  const conflict = await transaction.eventoAgenda.findFirst({
    where: {
      tenantId: event.tenantId,
      imovelId: event.imovelId,
      tipo: 'VISIT',
      status: { not: 'CANCELLED' },
      id: event.id ? { not: event.id } : undefined,
      inicio: { lt: event.fim },
      OR: [
        { fim: { gt: event.inicio } },
        { inicio: { gt: new Date(event.inicio.getTime() - AGENDA_MINIMUM_VISIT_MINUTES * 60000) } },
      ],
    },
    select: { id: true },
  })
  if (conflict) throw new AgendaPropertyVisitConflictError()
}
