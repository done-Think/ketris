import { agendaEventInclude } from './agenda-event-query'
import type { EventoAgendaWithLinks } from '../types/prisma-agenda-event'
import { assertResponsibleReservation } from './agenda-responsible-reservation'
import { recordAgendaAudit } from './agenda-audit'
import type { AgendaCancellation } from '../types/audit'
import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { AgendaEventRepository } from '../application/ports/agenda-event-repository.port'
import { selectAgendaLinkedUser } from '../domain/select-agenda-linked-user'
import type { AgendaEvent } from '../domain/agenda-event.entity'
import type {
  AgendaEventChanges,
  AgendaEventLinks,
  AgendaEventListFilters,
  AgendaEventReschedule,
  AgendaReadScope,
  NewAgendaEvent,
} from '../types/agenda-event'
import { AgendaEventUserLinkUnavailableError } from '../domain/errors'
import { assertVisitReservation, lockAgendaEvent } from './agenda-visit-reservation'

export class PrismaAgendaEventRepository implements AgendaEventRepository {
  create(event: NewAgendaEvent, links?: AgendaEventLinks): Promise<AgendaEvent> {
    return prisma.$transaction(async (transaction) => {
      await assertResponsibleReservation(transaction, event)
      await assertVisitReservation(transaction, {
        ...event,
        imovelId: event.imovelId ?? null,
        tipo: event.tipo ?? null,
      })
      const linkedUserIds = await resolveLinkedUserIds(transaction, event.tenantId, links)
      const participantUserIds = toParticipantUserIds(links, linkedUserIds)

      const created = await transaction.eventoAgenda.create({
        data: {
          tenantId: event.tenantId,
          responsavelId: event.responsavelId,
          criadoPorId: event.criadoPorId,
          donoUsuarioId: links?.donoEmail ? linkedUserIds.get(links.donoEmail) : null,
          imovelId: event.imovelId ?? null,
          referenciaImovelLivre: event.referenciaImovelLivre ?? null,
          titulo: event.titulo,
          tipo: event.tipo ?? null,
          destino: event.destino,
          interno: event.interno,
          inicio: event.inicio,
          fim: event.fim,
          participanteNome: event.participanteNome,
          participanteTelefone: event.participanteTelefone,
          notas: event.notas ?? null,
          participantes: participantUserIds.length
            ? { create: participantUserIds.map((usuarioId) => ({ usuarioId })) }
            : undefined,
        },
        include: agendaEventInclude,
      })

      await recordAgendaAudit(transaction, {
        tenantId: created.tenantId,
        eventId: created.id,
        actorUserId: event.criadoPorId,
        action: 'CREATED',
      })
      return mapAgendaEvent(created)
    })
  }

  list(filters: AgendaEventListFilters): Promise<AgendaEvent[]> {
    return prisma.eventoAgenda
      .findMany({
        where: {
          AND: [
            readScopeWhere(filters.scope),
            {
              responsavelId: filters.responsavelId,
              inicio: { lt: filters.to },
              fim: { gt: filters.from },
            },
          ],
        },
        include: agendaEventInclude,
        orderBy: { inicio: 'asc' },
      })
      .then((events) => events.map(mapAgendaEvent))
  }

  findByScopeAndId(scope: AgendaReadScope, id: string): Promise<AgendaEvent | null> {
    return prisma.eventoAgenda
      .findFirst({ where: { AND: [readScopeWhere(scope), { id }] }, include: agendaEventInclude })
      .then((event) => (event ? mapAgendaEvent(event) : null))
  }

  findByTenantAndId(tenantId: string, id: string): Promise<AgendaEvent | null> {
    return prisma.eventoAgenda
      .findFirst({ where: { tenantId, id }, include: agendaEventInclude })
      .then((event) => (event ? mapAgendaEvent(event) : null))
  }

  update(
    tenantId: string,
    id: string,
    changes: AgendaEventChanges,
    links?: AgendaEventLinks,
    actorUserId?: string,
  ): Promise<AgendaEvent | null> {
    return prisma.$transaction(async (transaction) => {
      await lockAgendaEvent(transaction, tenantId, id)
      const existing = await transaction.eventoAgenda.findFirst({
        where: { tenantId, id },
        select: {
          id: true,
          tenantId: true,
          responsavelId: true,
          imovelId: true,
          tipo: true,
          status: true,
          inicio: true,
          fim: true,
        },
      })

      if (!existing) {
        return null
      }

      if (
        changes.inicio !== undefined ||
        changes.fim !== undefined ||
        changes.responsavelId !== undefined ||
        (existing.status === 'CANCELLED' && changes.status && changes.status !== 'CANCELLED')
      ) {
        await assertResponsibleReservation(transaction, {
          ...existing,
          responsavelId: changes.responsavelId ?? existing.responsavelId,
          inicio: changes.inicio ?? existing.inicio,
          fim: changes.fim ?? existing.fim,
          status: changes.status ?? existing.status,
        })
      }

      await assertVisitReservation(transaction, {
        ...existing,
        imovelId: changes.imovelId === undefined ? existing.imovelId : changes.imovelId,
        tipo: changes.tipo === undefined ? existing.tipo : changes.tipo,
        status: changes.status ?? existing.status,
        inicio: changes.inicio ?? existing.inicio,
        fim: changes.fim ?? existing.fim,
      })

      const linkedUserIds = await resolveLinkedUserIds(transaction, tenantId, links)

      if (links?.participanteEmails !== undefined) {
        await transaction.eventoAgendaParticipante.deleteMany({ where: { eventoId: id } })

        const participantUserIds = toParticipantUserIds(links, linkedUserIds)

        if (participantUserIds.length) {
          await transaction.eventoAgendaParticipante.createMany({
            data: participantUserIds.map((usuarioId) => ({ eventoId: id, usuarioId })),
          })
        }
      }

      const updated = await transaction.eventoAgenda.update({
        where: { id, tenantId },
        data: {
          titulo: changes.titulo,
          inicio: changes.inicio,
          fim: changes.fim,
          tipo: changes.tipo,
          destino: changes.destino,
          interno: changes.interno,
          responsavelId: changes.responsavelId,
          status: changes.status,
          ...(changes.status === 'CANCELLED'
            ? {
                canceladoEm: new Date(),
                canceladoPorId: actorUserId ?? null,
                motivoCancelamento: changes.motivoCancelamento,
              }
            : {}),
          imovelId: changes.imovelId,
          referenciaImovelLivre: changes.referenciaImovelLivre,
          participanteNome: changes.participanteNome,
          participanteTelefone: changes.participanteTelefone,
          notas: changes.notas,
          donoUsuarioId:
            links?.donoEmail === undefined
              ? undefined
              : links.donoEmail === null
                ? null
                : linkedUserIds.get(links.donoEmail),
        },
        include: agendaEventInclude,
      })

      const changedFields = [
        ...Object.entries(changes)
          .filter(([, value]) => value !== undefined)
          .map(([field]) => agendaChangeFieldNames[field] ?? field),
        ...(links?.donoEmail !== undefined ? ['ownerEmail'] : []),
        ...(links?.participanteEmails !== undefined ? ['participantEmails'] : []),
      ]
      await recordAgendaAudit(transaction, {
        tenantId,
        eventId: id,
        actorUserId,
        action: changes.status === 'CANCELLED' ? 'CANCELLED' : 'UPDATED',
        changedFields,
        cancellationReason: changes.status === 'CANCELLED' ? changes.motivoCancelamento : null,
      })
      return mapAgendaEvent(updated)
    })
  }

  reschedule(
    tenantId: string,
    id: string,
    reschedule: AgendaEventReschedule,
    actorUserId?: string,
  ): Promise<AgendaEvent | null> {
    return prisma.$transaction(async (transaction) => {
      await lockAgendaEvent(transaction, tenantId, id)
      const existing = await transaction.eventoAgenda.findFirst({
        where: { tenantId, id },
        select: {
          id: true,
          tenantId: true,
          responsavelId: true,
          imovelId: true,
          tipo: true,
          status: true,
          inicio: true,
          fim: true,
        },
      })

      if (!existing) {
        return null
      }

      await assertResponsibleReservation(transaction, {
        ...existing,
        ...reschedule,
        status: 'CONFIRMED',
      })
      await assertVisitReservation(transaction, { ...existing, ...reschedule, status: 'CONFIRMED' })

      const updated = await transaction.eventoAgenda.update({
        where: { id },
        data: {
          inicio: reschedule.inicio,
          fim: reschedule.fim,
          status: 'CONFIRMED',
        },
        include: agendaEventInclude,
      })

      await recordAgendaAudit(transaction, {
        tenantId,
        eventId: id,
        actorUserId,
        action: 'RESCHEDULED',
        changedFields: ['start', 'end', 'status'],
      })
      return mapAgendaEvent(updated)
    })
  }

  cancel(
    tenantId: string,
    id: string,
    cancellation: AgendaCancellation,
  ): Promise<AgendaEvent | null> {
    return prisma.$transaction(async (transaction) => {
      await lockAgendaEvent(transaction, tenantId, id)
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
          status: 'CANCELLED',
          canceladoEm: new Date(),
          canceladoPorId: cancellation.actorUserId ?? null,
          motivoCancelamento: cancellation.reason,
        },
        include: agendaEventInclude,
      })

      await recordAgendaAudit(transaction, {
        tenantId,
        eventId: id,
        actorUserId: cancellation.actorUserId,
        action: 'CANCELLED',
        changedFields: ['status', 'cancellationReason'],
        cancellationReason: cancellation.reason,
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

function readScopeWhere(scope: AgendaReadScope): Prisma.EventoAgendaWhereInput {
  if (scope.kind === 'tenant') {
    return { tenantId: scope.tenantId }
  }

  if (scope.kind === 'agent') {
    return {
      tenantId: scope.tenantId,
      OR: [
        { destino: 'SHARED_TEAM', interno: false },
        { destino: 'ALL_AGENTS' },
        { destino: 'ASSIGNED_AGENT', responsavelId: scope.userId },
      ],
    }
  }
  if (scope.kind === 'owner') {
    return {
      tenantId: scope.tenantId,
      interno: false,
      OR: [
        { responsavelId: scope.userId },
        { criadoPorId: scope.userId },
        { imovel: { proprietarioId: scope.userId, tenantId: scope.tenantId } },
        { donoUsuarioId: scope.userId },
        { participantes: { some: { usuarioId: scope.userId } } },
      ],
    }
  }

  return {
    interno: false,
    OR: [
      { criadoPorId: scope.userId },
      { donoUsuarioId: scope.userId },
      { participantes: { some: { usuarioId: scope.userId } } },
    ],
  }
}

async function resolveLinkedUserIds(
  transaction: Prisma.TransactionClient,
  eventTenantId: string,
  links: AgendaEventLinks | undefined,
): Promise<Map<string, string>> {
  const emails = new Set<string>()

  if (links?.donoEmail) emails.add(links.donoEmail)
  links?.participanteEmails?.forEach((email) => emails.add(email))

  if (emails.size === 0) {
    return new Map()
  }

  const users = await transaction.usuario.findMany({
    where: {
      OR: [...emails].map((email) => ({ email: { equals: email, mode: 'insensitive' as const } })),
    },
    select: {
      id: true,
      email: true,
      tenantId: true,
      papel: true,
      ativo: true,
      vinculoAprovadoEm: true,
    },
  })
  const linkedUserIds = new Map<string, string>()

  for (const email of emails) {
    const user = selectAgendaLinkedUser(users, email, eventTenantId)

    if (!user) {
      throw new AgendaEventUserLinkUnavailableError(email)
    }

    linkedUserIds.set(email, user.id)
  }

  return linkedUserIds
}

function toParticipantUserIds(
  links: AgendaEventLinks | undefined,
  linkedUserIds: Map<string, string>,
): string[] {
  const userIds = (links?.participanteEmails ?? []).map((email) => linkedUserIds.get(email))

  return [...new Set(userIds.filter((userId): userId is string => Boolean(userId)))]
}

function mapAgendaEvent(event: EventoAgendaWithLinks): AgendaEvent {
  return {
    id: event.id,
    tenantId: event.tenantId,
    responsavelId: event.responsavelId,
    responsavelNome: event.responsavel.nome,
    criadoPorId: event.criadoPorId,
    criadoPor: event.criadoPor,
    donoUsuarioId: event.donoUsuarioId,
    dono: event.donoUsuario,
    participantes: event.participantes.map((participante) => participante.usuario),
    imovelId: event.imovelId,
    referenciaImovelLivre: event.referenciaImovelLivre,
    titulo: event.titulo,
    tipo: event.tipo,
    destino: event.destino,
    interno: event.interno,
    status: event.status,
    inicio: event.inicio,
    fim: event.fim,
    participanteNome: event.participanteNome,
    participanteTelefone: event.participanteTelefone,
    notas: event.notas,
    canceladoEm: event.canceladoEm,
    canceladoPorId: event.canceladoPorId,
    motivoCancelamento: event.motivoCancelamento,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  }
}

const agendaChangeFieldNames: Record<string, string> = {
  inicio: 'start',
  fim: 'end',
  destino: 'audience',
  interno: 'internal',
  responsavelId: 'responsibleId',
  titulo: 'title',
  tipo: 'kind',
  status: 'status',
  imovelId: 'propertyId',
  referenciaImovelLivre: 'propertyReference',
  participanteNome: 'participantName',
  participanteTelefone: 'participantPhone',
  notas: 'notes',
  motivoCancelamento: 'cancellationReason',
}
