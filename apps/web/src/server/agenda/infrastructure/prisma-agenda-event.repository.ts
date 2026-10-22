import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import { normalizeEmail } from '@server/shared/normalize-email'

import type { AgendaEventRepository } from '../application/ports/agenda-event-repository.port'
import { canLinkUserToAgendaEvent } from '../domain/agenda-access-rules'
import type {
  AgendaEvent,
  AgendaEventChanges,
  AgendaEventLinks,
  AgendaEventListFilters,
  AgendaEventReschedule,
  AgendaReadScope,
  NewAgendaEvent,
} from '../domain/agenda-event.entity'
import { AgendaEventUserLinkUnavailableError } from '../domain/errors'
import { assertVisitReservation, lockAgendaEvent } from './agenda-visit-reservation'

const linkedUserSelect = { id: true, nome: true, email: true } as const

const agendaEventInclude = {
  responsavel: { select: { nome: true } },
  donoUsuario: { select: linkedUserSelect },
  participantes: {
    select: { usuario: { select: linkedUserSelect } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.EventoAgendaInclude

type EventoAgendaWithLinks = Prisma.EventoAgendaGetPayload<{ include: typeof agendaEventInclude }>

export class PrismaAgendaEventRepository implements AgendaEventRepository {
  create(event: NewAgendaEvent, links?: AgendaEventLinks): Promise<AgendaEvent> {
    return prisma.$transaction(async (transaction) => {
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
  ): Promise<AgendaEvent | null> {
    return prisma.$transaction(async (transaction) => {
      await lockAgendaEvent(transaction, tenantId, id)
      const existing = await transaction.eventoAgenda.findFirst({
        where: { tenantId, id },
        select: {
          id: true,
          tenantId: true,
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
        where: { id },
        data: {
          titulo: changes.titulo,
          inicio: changes.inicio,
          fim: changes.fim,
          tipo: changes.tipo,
          destino: changes.destino,
          interno: changes.interno,
          responsavelId: changes.responsavelId,
          status: changes.status,
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

      return mapAgendaEvent(updated)
    })
  }

  reschedule(
    tenantId: string,
    id: string,
    reschedule: AgendaEventReschedule,
  ): Promise<AgendaEvent | null> {
    return prisma.$transaction(async (transaction) => {
      await lockAgendaEvent(transaction, tenantId, id)
      const existing = await transaction.eventoAgenda.findFirst({
        where: { tenantId, id },
        select: {
          id: true,
          tenantId: true,
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
        include: agendaEventInclude,
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
        { destino: 'LEGACY_TEAM', interno: false },
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
        { destino: 'LEGACY_TEAM' },
        { imovel: { proprietarioId: scope.userId, tenantId: scope.tenantId } },
        { donoUsuarioId: scope.userId },
        { participantes: { some: { usuarioId: scope.userId } } },
      ],
    }
  }

  return {
    interno: false,
    OR: [{ donoUsuarioId: scope.userId }, { participantes: { some: { usuarioId: scope.userId } } }],
  }
}

/**
 * Resolves the link e-mails to user ids inside the caller's transaction and rejects the whole
 * operation on the first e-mail that can't be linked, so the event is never partially written.
 */
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
  const usersByEmail = new Map(users.map((user) => [normalizeEmail(user.email), user]))
  const linkedUserIds = new Map<string, string>()

  for (const email of emails) {
    const user = usersByEmail.get(email)

    if (!user || !canLinkUserToAgendaEvent(user, eventTenantId)) {
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
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  }
}
