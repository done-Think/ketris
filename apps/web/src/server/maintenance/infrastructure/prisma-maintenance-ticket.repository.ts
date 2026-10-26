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
    const row = await prisma.contrato.findFirst({
      where: {
        id: contractId,
        ...(actor.actorPapel === 'RENTER'
          ? renterContractScope(actor.actorId)
          : { tenantId: actor.actorTenantId, imovel: { tenantId: actor.actorTenantId } }),
      },
      include: contractInclude,
    })
    return row && validContract(row) ? toContract(row) : null
  }
  async findUser(tenantId: string, userId: string) {
    const row = await prisma.usuario.findFirst({
      where: { id: userId, tenantId, ativo: true },
      select: { id: true, papel: true },
    })
    return row ? { id: row.id, role: row.papel } : null
  }
  async options(actor: MaintenanceActor): Promise<MaintenanceOptions> {
    const where: Prisma.ContratoWhereInput = {
      tenantId: actor.actorTenantId,
      imovel: { tenantId: actor.actorTenantId },
    }
    if (actor.actorPapel === 'AGENT')
      where.imovel = { tenantId: actor.actorTenantId, responsavelId: actor.actorId }
    else if (actor.actorPapel === 'PROPERTY_OWNER')
      where.imovel = { tenantId: actor.actorTenantId, proprietarioId: actor.actorId }
    else if (actor.actorPapel === 'RENTER')
      Object.assign(where, {
        tenantId: undefined,
        imovel: undefined,
        ...renterContractScope(actor.actorId),
      })
    else if (!isAgencyManager(actor.actorPapel)) throw new ForbiddenError()
    const contracts = await prisma.contrato.findMany({
      where,
      include: contractInclude,
      orderBy: { codigo: 'asc' },
    })
    const validContracts = contracts.filter(validContract)
    const renterEmails = [
      ...new Set(
        validContracts.flatMap((c) =>
          c.partes.filter((p) => p.papel === 'LOCATARIO').map((p) => normalizeEmail(p.email)),
        ),
      ),
    ]
    const users = isAgencyManager(actor.actorPapel)
      ? await prisma.usuario.findMany({
          where: {
            ativo: true,
            OR: [
              { tenantId: actor.actorTenantId, papel: { not: 'RENTER' } },
              { papel: 'RENTER', email: { in: renterEmails, mode: 'insensitive' } },
            ],
          },
          select: { id: true, nome: true, papel: true },
          orderBy: { nome: 'asc' },
        })
      : []
    return {
      contracts: validContracts.map(toContract),
      users: users.map((u) => ({ id: u.id, name: u.nome, role: u.papel })),
    }
  }
  async linkUsers(actor: MaintenanceActor, input: MaintenanceUserLinkInput) {
    if (!this.linkParty) throw new Error('Integração de vínculos contratuais não configurada.')
    return regularizeMaintenanceLinks(actor, input, this.linkParty)
  }
  async create(input: NewMaintenanceTicket) {
    const row = await prisma.chamadoManutencao.create({
      data: {
        tenantId: input.tenantId,
        imovelId: input.propertyId,
        contratoId: input.contractId,
        categoria: input.category,
        prioridade: input.priority,
        titulo: input.title,
        descricao: input.description,
        atendimentoEm: input.scheduledAt,
        abertoPorId: input.openedById,
        abertoPorNome: input.openedByName,
        atividades: {
          create: {
            tipo: 'NOTA',
            mensagem: 'Chamado aberto.',
            systemAction: 'TICKET_CREATED',
            autorId: input.openedById,
            autorNome: input.openedByName,
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
        const rows = await tx.chamadoManutencao.findMany({
          where: { id: { in: ids.map((item) => item.id) } },
          include: ticketInclude,
        })
        const groups = await tx.$queryRaw<MaintenanceSummaryRow[]>(
          Prisma.sql`SELECT c.status::text AS status, count(*) AS count, count(*) FILTER (WHERE c.prioridade = 'URGENTE') AS urgent, sum(EXTRACT(EPOCH FROM (c."resolvidoEm" - c."createdAt")) / 86400) AS "resolutionDays", count(c."resolvidoEm") AS resolved FROM ${query.from} WHERE ${query.base} GROUP BY c.status`,
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
    const row = await prisma.chamadoManutencao.findFirst({
      where: { ...maintenanceTicketScope(actor), id: ticketId },
      include: ticketInclude,
    })
    return row ? toTicket(row) : null
  }
  async findAttachmentTicket(actor: MaintenanceActor, url: string) {
    const row = await prisma.chamadoManutencao.findFirst({
      where: { ...maintenanceTicketScope(actor), anexos: { some: { url } } },
      include: ticketInclude,
    })
    return row ? toTicket(row) : null
  }
  private async lockTicket(
    tx: Prisma.TransactionClient,
    ticket: MaintenanceTicket,
    changes: Prisma.ChamadoManutencaoUncheckedUpdateManyInput = {},
  ) {
    const nextVersion = new Date(Math.max(Date.now(), ticket.updatedAt.getTime() + 1))
    const result = await tx.chamadoManutencao.updateMany({
      where: {
        id: ticket.id,
        tenantId: ticket.tenantId,
        updatedAt: ticket.updatedAt,
        excluidoEm: ticket.deletedAt,
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
      if (changes.contractId) {
        const contract = await tx.contrato.findFirst({
          where: {
            id: changes.contractId,
            tenantId: ticket.tenantId,
            imovelId: changes.propertyId ?? ticket.propertyId,
            imovel: { tenantId: ticket.tenantId },
          },
          select: { id: true },
        })
        if (!contract) throw new MaintenancePropertyNotFoundError()
      }
      const version = await this.lockTicket(tx, ticket, {
        imovelId: changes.propertyId,
        contratoId: changes.contractId,
        responsavelId: changes.responsibleId,
        categoria: changes.category,
        prioridade: changes.priority,
        titulo: changes.title,
        descricao: changes.description,
        atendimentoEm: changes.scheduledAt,
        status: changes.status,
        resolvidoEm: changes.resolvedAt,
        concluidoPorId: changes.completedById,
        concluidoPorPapel: changes.completedByRole,
        excluidoEm: changes.deletedAt,
        excluidoPorId: changes.deletedById,
      })
      if (request?.kind === 'request') {
        const pending = await tx.solicitacaoTrocaPrestador.count({
          where: { chamadoId: ticket.id, status: 'PENDENTE' },
        })
        if (pending) throw new ConflictError('Ja existe uma solicitacao pendente.')
        await tx.solicitacaoTrocaPrestador.create({
          data: {
            chamadoId: ticket.id,
            justificativa: request.reason,
            solicitanteId: request.actor.actorId,
            solicitanteNome: request.actor.actorName,
          },
        })
      } else if (request?.kind === 'decision') {
        const result = await tx.solicitacaoTrocaPrestador.updateMany({
          where: { id: request.requestId, chamadoId: ticket.id, status: 'PENDENTE' },
          data: {
            status: request.approved ? 'APROVADA' : 'REJEITADA',
            decisaoJustificativa: request.reason,
            decididoPorId: request.actor.actorId,
            decididoPorNome: request.actor.actorName,
            decididoEm: new Date(),
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
            actorPapel: activity.authorRole,
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
        await tx.chamadoManutencao.updateMany({
          where: { id: ticket.id, tenantId: ticket.tenantId, updatedAt: version },
          data: {
            prestadorId: record.id,
            prestadorNome: snapshot.name,
            prestadorTelefone: snapshot.phone,
            prestadorEmail: snapshot.email,
            prestadorObservacoes: snapshot.notes,
            updatedAt: version,
          },
        })
        activityToRecord = { ...activity, details: { ...activity.details, after: snapshot } }
      }
      await tx.atividadeChamadoManutencao.create({
        data: activityData(ticket.id, activityToRecord),
      })
      return toTicket(
        await tx.chamadoManutencao.findUniqueOrThrow({
          where: { id: ticket.id },
          include: ticketInclude,
        }),
      )
    })
  }
  async addNote(ticket: MaintenanceTicket, activity: NewMaintenanceActivity) {
    return prisma.$transaction(async (tx) => {
      await this.lockTicket(tx, ticket)
      return toActivity(
        await tx.atividadeChamadoManutencao.create({ data: activityData(ticket.id, activity) }),
      )
    })
  }
  async addAttachment(ticket: MaintenanceTicket, attachment: NewMaintenanceAttachment) {
    return prisma.$transaction(async (tx) => {
      if (attachment.uploadId) {
        const existing = await tx.anexoChamadoManutencao.findUnique({
          where: { uploadId: attachment.uploadId },
        })
        if (existing) {
          if (existing.chamadoId !== ticket.id)
            throw new ConflictError('Autorização de envio já utilizada.')
          return toAttachment(existing)
        }
      }
      await this.lockTicket(tx, ticket)
      const row = await tx.anexoChamadoManutencao.create({
        data: {
          chamadoId: ticket.id,
          nome: attachment.name,
          url: attachment.url,
          uploadId: attachment.uploadId,
        },
      })
      await tx.atividadeChamadoManutencao.create({
        data: activityData(ticket.id, {
          type: 'ANEXO_ADICIONADO',
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
    const rows = await prisma.atividadeChamadoManutencao.findMany({
      where: { chamadoId: ticketId, chamado: { tenantId } },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(toActivity)
  }
}
