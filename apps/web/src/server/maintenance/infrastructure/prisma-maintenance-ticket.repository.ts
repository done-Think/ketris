import { Prisma } from '@prisma/client'
import { isAgencyManager } from '@server/auth/domain/roles'
import { prisma } from '@server/db/prisma'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { normalizeEmail } from '@server/shared/normalize-email'
import { permissionsFor } from '../application/authorization'
import { MaintenancePropertyNotFoundError } from '../domain/errors'
import type { MaintenanceSummaryRow } from '../types/maintenance-summary'
import type {
  MaintenanceActor,
  MaintenanceMutation,
  MaintenanceOptions,
  MaintenanceRequestMutation,
  MaintenanceTicket,
  MaintenanceTicketListFilters,
  MaintenanceTicketListResult,
  MaintenanceUserLinkInput,
  NewMaintenanceActivity,
  NewMaintenanceAttachment,
  NewMaintenanceTicket,
} from '../types/maintenance-ticket'
import type { MaintenanceTicketRepository } from '../types/maintenance-ticket-repository'
import type { MaintenanceContractPartyLink } from '../types/prisma-maintenance-ticket-repository'
import {
  maintenanceTicketScope,
  renterContractScope,
  validContract,
} from './maintenance-access-scope'
import { maintenanceListQuery } from './maintenance-list-query'
import { maintenanceMutationAuthor } from './maintenance-mutation-author'
import {
  activityData,
  contractInclude,
  ticketInclude,
  toActivity,
  toAttachment,
  toContract,
  toTicket,
} from './maintenance-ticket-mapper'
import { regularizeMaintenanceLinks } from './prisma-maintenance-links'
import { resolveMaintenanceProvider } from './prisma-maintenance-provider.repository'

export { maintenanceTicketScope } from './maintenance-access-scope'

export class PrismaMaintenanceTicketRepository implements MaintenanceTicketRepository {
  constructor(private readonly linkParty?: MaintenanceContractPartyLink) {}

  async findContract(actor: MaintenanceActor, contractId: string) {
    const row = await prisma.contract.findFirst({
      where: {
        id: contractId,
        ...(actor.actorRole === 'RENTER'
          ? renterContractScope(actor.actorId)
          : { tenantId: actor.actorTenantId, property: { tenantId: actor.actorTenantId } }),
      },
      include: contractInclude,
    })
    return row && validContract(row) ? toContract(row) : null
  }
  async findUser(tenantId: string, userId: string) {
    const row = await prisma.user.findFirst({
      where: { id: userId, tenantId, active: true },
      select: { id: true, role: true },
    })
    return row ? { id: row.id, role: row.role } : null
  }
  async options(actor: MaintenanceActor): Promise<MaintenanceOptions> {
    const where: Prisma.ContractWhereInput = {
      tenantId: actor.actorTenantId,
      property: { tenantId: actor.actorTenantId },
    }
    if (actor.actorRole === 'AGENT')
      where.property = { tenantId: actor.actorTenantId, responsibleId: actor.actorId }
    else if (actor.actorRole === 'PROPERTY_OWNER')
      where.property = { tenantId: actor.actorTenantId, ownerId: actor.actorId }
    else if (actor.actorRole === 'RENTER')
      Object.assign(where, {
        tenantId: undefined,
        property: undefined,
        ...renterContractScope(actor.actorId),
      })
    else if (!isAgencyManager(actor.actorRole)) throw new ForbiddenError()
    const contracts = await prisma.contract.findMany({
      where,
      include: contractInclude,
      orderBy: { code: 'asc' },
    })
    const validContracts = contracts.filter(validContract)
    const renterEmails = [
      ...new Set(
        validContracts.flatMap((c) =>
          c.parties.filter((p) => p.role === 'RENTER').map((p) => normalizeEmail(p.email)),
        ),
      ),
    ]
    const users = isAgencyManager(actor.actorRole)
      ? await prisma.user.findMany({
          where: {
            active: true,
            OR: [
              { tenantId: actor.actorTenantId, role: { not: 'RENTER' } },
              { role: 'RENTER', email: { in: renterEmails, mode: 'insensitive' } },
            ],
          },
          select: { id: true, name: true, role: true },
          orderBy: { name: 'asc' },
        })
      : []
    return {
      contracts: validContracts.map(toContract),
      users: users.map((u) => ({ id: u.id, name: u.name, role: u.role })),
    }
  }
  async linkUsers(actor: MaintenanceActor, input: MaintenanceUserLinkInput) {
    if (!this.linkParty) throw new Error('Integração de vínculos contratuais não configurada.')
    return regularizeMaintenanceLinks(actor, input, this.linkParty)
  }
  async create(input: NewMaintenanceTicket) {
    const authorId = await maintenanceMutationAuthor(prisma, input, input.openedById)
    const row = await prisma.maintenanceTicket.create({
      data: {
        tenantId: input.tenantId,
        propertyId: input.propertyId,
        contractId: input.contractId,
        category: input.category,
        priority: input.priority,
        title: input.title,
        description: input.description,
        serviceAt: input.scheduledAt,
        openedById: input.openedById,
        updatedById: authorId,
        openedByName: input.openedByName,
        activities: {
          create: {
            type: 'NOTE',
            message: 'Chamado aberto.',
            systemAction: 'TICKET_CREATED',
            authorId: input.openedById,
            authorName: input.openedByName,
          },
        },
      },
      include: ticketInclude,
    })
    return toTicket(row)
  }
  async findMany(filters: MaintenanceTicketListFilters): Promise<MaintenanceTicketListResult> {
    const query = maintenanceListQuery(filters)
    const result = await prisma.$transaction(
      async (tx) => {
        const [count] = await tx.$queryRaw<{ count: bigint }[]>(
          Prisma.sql`SELECT count(*) AS count FROM ${query.from} WHERE ${query.filter}`,
        )
        const totalCount = Number(count.count)
        const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 10))
        const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
        const page = Math.min(Math.max(1, filters.page ?? 1), pageCount)
        const ids = await tx.$queryRaw<{ id: string }[]>(
          Prisma.sql`SELECT c.id FROM ${query.from} WHERE ${query.filter} ORDER BY c."updatedAt" DESC, c.id ASC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
        )
        const rows = await tx.maintenanceTicket.findMany({
          where: { id: { in: ids.map((item) => item.id) } },
          include: ticketInclude,
        })
        const groups = await tx.$queryRaw<MaintenanceSummaryRow[]>(
          Prisma.sql`SELECT c.status::text AS status, count(*) AS count, count(*) FILTER (WHERE c.priority = 'URGENT') AS urgent, sum(EXTRACT(EPOCH FROM (c."resolvedAt" - c."createdAt")) / 86400) AS "resolutionDays", count(c."resolvedAt") AS resolved FROM ${query.from} WHERE ${query.base} GROUP BY c.status`,
        )
        const byId = new Map(rows.map((row) => [row.id, row]))
        const ordered = ids.flatMap((item) => {
          const row = byId.get(item.id)
          return row ? [row] : []
        })
        const resolvedCount = groups.reduce((sum, group) => sum + Number(group.resolved), 0)
        return {
          rows: ordered,
          totalCount,
          pagination: { page, pageSize, pageCount, totalCount },
          summary: {
            totalCount: groups.reduce((sum, group) => sum + Number(group.count), 0),
            urgentCount: groups.reduce((sum, group) => sum + Number(group.urgent), 0),
            byStatus: Object.fromEntries(
              groups.map((group) => [group.status, Number(group.count)]),
            ),
            averageResolutionDays: resolvedCount
              ? groups.reduce((sum, group) => sum + Number(group.resolutionDays ?? 0), 0) /
                resolvedCount
              : null,
          },
        }
      },
      { isolationLevel: 'RepeatableRead' },
    )
    return {
      pagination: result.pagination,
      summary: result.summary,
      items: result.rows.map((row) => {
        const ticket = toTicket(row)
        return {
          id: ticket.id,
          propertyId: ticket.propertyId,
          propertyTitle: ticket.propertyTitle,
          contractId: ticket.contractId,
          responsibleId: ticket.responsibleId,
          responsibleName: ticket.responsibleName,
          deletedAt: ticket.deletedAt,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          title: ticket.title,
          openedByName: ticket.openedByName,
          resolvedAt: ticket.resolvedAt,
          scheduledAt: ticket.scheduledAt ?? null,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          permissions: permissionsFor(filters.actor, ticket),
        }
      }),
      totalCount: result.totalCount,
    }
  }
  async findById(actor: MaintenanceActor, ticketId: string) {
    const row = await prisma.maintenanceTicket.findFirst({
      where: { ...maintenanceTicketScope(actor), id: ticketId },
      include: ticketInclude,
    })
    return row ? toTicket(row) : null
  }
  async findAttachmentTicket(actor: MaintenanceActor, url: string) {
    const row = await prisma.maintenanceTicket.findFirst({
      where: { ...maintenanceTicketScope(actor), attachments: { some: { url } } },
      include: ticketInclude,
    })
    return row ? toTicket(row) : null
  }
  private async lockTicket(
    tx: Prisma.TransactionClient,
    ticket: MaintenanceTicket,
    changes: Prisma.MaintenanceTicketUncheckedUpdateManyInput = {},
  ) {
    const nextVersion = new Date(Math.max(Date.now(), ticket.updatedAt.getTime() + 1))
    const result = await tx.maintenanceTicket.updateMany({
      where: {
        id: ticket.id,
        tenantId: ticket.tenantId,
        updatedAt: ticket.updatedAt,
        deletedAt: ticket.deletedAt,
      },
      data: {
        ...changes,
        updatedAt: nextVersion,
      },
    })
    if (result.count !== 1)
      throw new ConflictError('O chamado foi alterado. Atualize a tela e tente novamente.')
    return nextVersion
  }
  async mutate(
    ticket: MaintenanceTicket,
    changes: MaintenanceMutation,
    activity: NewMaintenanceActivity,
    request?: MaintenanceRequestMutation,
  ) {
    return prisma.$transaction(async (tx) => {
      const authorId = await maintenanceMutationAuthor(tx, ticket, activity.authorId)
      if (changes.contractId) {
        const contract = await tx.contract.findFirst({
          where: {
            id: changes.contractId,
            tenantId: ticket.tenantId,
            propertyId: changes.propertyId ?? ticket.propertyId,
            property: { tenantId: ticket.tenantId },
          },
          select: { id: true },
        })
        if (!contract) throw new MaintenancePropertyNotFoundError()
      }
      const version = await this.lockTicket(tx, ticket, {
        updatedById: authorId,
        propertyId: changes.propertyId,
        contractId: changes.contractId,
        responsibleId: changes.responsibleId,
        category: changes.category,
        priority: changes.priority,
        title: changes.title,
        description: changes.description,
        serviceAt: changes.scheduledAt,
        status: changes.status,
        resolvedAt: changes.resolvedAt,
        completedById: changes.completedById,
        completedByRole: changes.completedByRole,
        deletedAt: changes.deletedAt,
        deletedById:
          changes.deletedAt === undefined
            ? undefined
            : changes.deletedAt === null
              ? null
              : authorId,
      })
      if (request?.kind === 'request') {
        const pending = await tx.providerChangeRequest.count({
          where: { ticketId: ticket.id, status: 'PENDING' },
        })
        if (pending) throw new ConflictError('Ja existe uma solicitacao pendente.')
        await tx.providerChangeRequest.create({
          data: {
            ticketId: ticket.id,
            justification: request.reason,
            requesterId: request.actor.actorId,
            requesterName: request.actor.actorName,
          },
        })
      } else if (request?.kind === 'decision') {
        const result = await tx.providerChangeRequest.updateMany({
          where: { id: request.requestId, ticketId: ticket.id, status: 'PENDING' },
          data: {
            status: request.approved ? 'APPROVED' : 'REJECTED',
            decisionJustification: request.reason,
            decidedById: request.actor.actorId,
            decidedByName: request.actor.actorName,
            decidedAt: new Date(),
          },
        })
        if (result.count !== 1) throw new ConflictError('A solicitacao ja foi decidida.')
      }
      let activityToRecord = activity
      if (changes.provider) {
        if (!activity.authorId || !activity.authorRole) throw new ForbiddenError()
        const record = await resolveMaintenanceProvider(
          tx,
          {
            actorId: activity.authorId,
            actorName: activity.authorName ?? '',
            actorTenantId: ticket.tenantId,
            actorRole: activity.authorRole,
          },
          ticket.tenantId,
          changes.provider,
        )
        const snapshot = {
          id: record.id,
          name: record.name,
          phone: record.phone ?? null,
          email: record.email ?? null,
          notes: record.notes ?? null,
        }
        await tx.maintenanceTicket.updateMany({
          where: { id: ticket.id, tenantId: ticket.tenantId, updatedAt: version },
          data: {
            providerId: record.id,
            providerName: snapshot.name,
            providerPhone: snapshot.phone,
            providerEmail: snapshot.email,
            providerNotes: snapshot.notes,
            updatedAt: version,
          },
        })
        activityToRecord = { ...activity, details: { ...activity.details, after: snapshot } }
      }
      await tx.maintenanceTicketActivity.create({
        data: activityData(ticket.id, activityToRecord),
      })
      return toTicket(
        await tx.maintenanceTicket.findUniqueOrThrow({
          where: { id: ticket.id },
          include: ticketInclude,
        }),
      )
    })
  }
  async addNote(ticket: MaintenanceTicket, activity: NewMaintenanceActivity) {
    return prisma.$transaction(async (tx) => {
      const authorId = await maintenanceMutationAuthor(tx, ticket, activity.authorId)
      await this.lockTicket(tx, ticket, { updatedById: authorId })
      return toActivity(
        await tx.maintenanceTicketActivity.create({ data: activityData(ticket.id, activity) }),
      )
    })
  }
  async addAttachment(ticket: MaintenanceTicket, attachment: NewMaintenanceAttachment) {
    return prisma.$transaction(async (tx) => {
      if (attachment.uploadId) {
        const existing = await tx.maintenanceTicketAttachment.findUnique({
          where: { uploadId: attachment.uploadId },
        })
        if (existing) {
          if (existing.ticketId !== ticket.id)
            throw new ConflictError('Autorização de envio já utilizada.')
          return toAttachment(existing)
        }
      }
      const authorId = await maintenanceMutationAuthor(tx, ticket, attachment.authorId)
      await this.lockTicket(tx, ticket, { updatedById: authorId })
      const row = await tx.maintenanceTicketAttachment.create({
        data: {
          ticketId: ticket.id,
          name: attachment.name,
          url: attachment.url,
          uploadId: attachment.uploadId,
        },
      })
      await tx.maintenanceTicketActivity.create({
        data: activityData(ticket.id, {
          type: 'ATTACHMENT_ADDED',
          systemAction: 'ATTACHMENT_ADDED',
          message: attachment.name,
          authorId: attachment.authorId,
          authorName: attachment.authorName,
        }),
      })
      return toAttachment(row)
    })
  }
  async findActivities(tenantId: string, ticketId: string) {
    const rows = await prisma.maintenanceTicketActivity.findMany({
      where: { ticketId: ticketId, ticket: { tenantId } },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(toActivity)
  }
}
