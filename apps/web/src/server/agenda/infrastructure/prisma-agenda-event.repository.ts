import type { EventoAgenda } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { AgendaEventRepository } from '../application/ports/agenda-event-repository.port'
import type {
  AgendaEvent,
  AgendaEventChanges,
  AgendaEventListFilters,
  AgendaEventReschedule,
  NewAgendaEvent,
} from '../domain/agenda-event.entity'

export class PrismaAgendaEventRepository implements AgendaEventRepository {
  create(event: NewAgendaEvent): Promise<AgendaEvent> {
    return prisma.eventoAgenda
      .create({
        data: {
          tenantId: event.tenantId,
          responsavelId: event.responsavelId,
          criadoPorId: event.criadoPorId,
          imovelId: event.imovelId ?? null,
          referenciaImovelLivre: event.referenciaImovelLivre ?? null,
          titulo: event.titulo,
          tipo: event.tipo ?? null,
          inicio: event.inicio,
          fim: event.fim,
          participanteNome: event.participanteNome,
          participanteTelefone: event.participanteTelefone,
          notas: event.notas ?? null,
        },
      })
      .then(mapAgendaEvent)
  }

  list(filters: AgendaEventListFilters): Promise<AgendaEvent[]> {
    return prisma.eventoAgenda
      .findMany({
        where: {
          tenantId: filters.tenantId,
          responsavelId: filters.responsavelId,
          inicio: { lt: filters.to },
          fim: { gt: filters.from },
        },
        orderBy: { inicio: 'asc' },
      })
      .then((events) => events.map(mapAgendaEvent))
  }

  findByTenantAndId(tenantId: string, id: string): Promise<AgendaEvent | null> {
    return prisma.eventoAgenda
      .findFirst({ where: { tenantId, id } })
      .then((event) => (event ? mapAgendaEvent(event) : null))
  }

  update(tenantId: string, id: string, changes: AgendaEventChanges): Promise<AgendaEvent | null> {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.eventoAgenda.findFirst({
        where: { tenantId, id },
        select: { id: true },
      })

      if (!existing) {
        return null
      }

      const updated = await transaction.eventoAgenda.update({
        where: { id },
        data: {
          titulo: changes.titulo,
          tipo: changes.tipo,
          status: changes.status,
          imovelId: changes.imovelId,
          referenciaImovelLivre: changes.referenciaImovelLivre,
          participanteNome: changes.participanteNome,
          participanteTelefone: changes.participanteTelefone,
          notas: changes.notas,
        },
      })

      return mapAgendaEvent(updated)
    })
  }

  reschedule(
    tenantId: string,
    id: string,
    reschedule: AgendaEventReschedule,
  ): Promise<AgendaEvent | null> {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.eventoAgenda.findFirst({
        where: { tenantId, id },
        select: { id: true },
      })

      if (!existing) {
        return null
      }

      const updated = await transaction.eventoAgenda.update({
        where: { id },
        data: {
          inicio: reschedule.inicio,
          fim: reschedule.fim,
          status: 'CONFIRMED',
        },
      })

      return mapAgendaEvent(updated)
    })
  }

  cancel(tenantId: string, id: string): Promise<AgendaEvent | null> {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.eventoAgenda.findFirst({
        where: { tenantId, id },
        select: { id: true },
      })

      if (!existing) {
        return null
      }

      const updated = await transaction.eventoAgenda.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })

      return mapAgendaEvent(updated)
    })
  }

  async hasOverlap(
    tenantId: string,
    responsavelId: string,
    inicio: Date,
    fim: Date,
    excludeEventId?: string,
  ): Promise<boolean> {
    const conflict = await prisma.eventoAgenda.findFirst({
      where: {
        tenantId,
        responsavelId,
        status: { not: 'CANCELLED' },
        id: excludeEventId ? { not: excludeEventId } : undefined,
        inicio: { lt: fim },
        fim: { gt: inicio },
      },
      select: { id: true },
    })

    return conflict !== null
  }
}

function mapAgendaEvent(event: EventoAgenda): AgendaEvent {
  return {
    id: event.id,
    tenantId: event.tenantId,
    responsavelId: event.responsavelId,
    criadoPorId: event.criadoPorId,
    imovelId: event.imovelId,
    referenciaImovelLivre: event.referenciaImovelLivre,
    titulo: event.titulo,
    tipo: event.tipo,
    status: event.status,
    inicio: event.inicio,
    fim: event.fim,
    participanteNome: event.participanteNome,
    participanteTelefone: event.participanteTelefone,
    notas: event.notas,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  }
}
