import type { MaintenanceUserLinkInput } from '../types/maintenance-ticket'
import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { MaintenancePropertyNotFoundError } from '../domain/errors'
import { normalizeEmail } from '@server/shared/normalize-email'
import type {
  MaintenanceActor,
  MaintenanceMutation,
  MaintenanceOptions,
  MaintenanceRequestMutation,
  MaintenanceTicket,
  MaintenanceTicketListFilters,
  MaintenanceTicketListResult,
  NewMaintenanceActivity,
  NewMaintenanceAttachment,
  NewMaintenanceTicket,
} from '../types/maintenance-ticket'
import type { MaintenanceTicketRepository } from '../types/maintenance-ticket-repository'
import { permissionsFor } from '../application/authorization'
import {
  contractInclude,
  ticketInclude,
  toContract,
  toActivity,
  toAttachment,
  toTicket,
  activityData,
} from './maintenance-ticket-mapper'
import {
  maintenanceTicketScope,
  renterContractScope,
  validContract,
} from './maintenance-access-scope'
import { regularizeMaintenanceLinks } from './prisma-maintenance-links'
import { isAgencyManager } from '@server/auth/domain/roles'

export { maintenanceTicketScope } from './maintenance-access-scope'

export class PrismaMaintenanceTicketRepository implements MaintenanceTicketRepository {
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
    return regularizeMaintenanceLinks(actor, input)
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
    const scope = maintenanceTicketScope(filters.actor)
    // Match all three stored relationships before pagination/counting; never trust the account's tenant.
    const renterContracts =
      filters.actor.actorPapel === 'RENTER'
        ? await prisma.contrato.findMany({
            where: renterContractScope(filters.actor.actorId),
            include: contractInclude,
          })
        : null
    const where: Prisma.ChamadoManutencaoWhereInput = {
      AND: [
        scope,
        {
          tenantId: filters.actor.actorPapel === 'RENTER' ? undefined : filters.tenantId,
          excluidoEm: filters.archived ? { not: null } : null,
          status: filters.status,
          prioridade: filters.priority,
          imovelId: filters.propertyId,
        },
        ...(renterContracts
          ? [
              {
                OR: renterContracts
                  .filter(validContract)
                  .map((c) => ({ tenantId: c.tenantId, imovelId: c.imovelId, contratoId: c.id })),
              },
            ]
          : []),
        ...(filters.search?.trim()
          ? [
              {
                OR: [
                  { titulo: { contains: filters.search.trim(), mode: 'insensitive' as const } },
                  { categoria: { contains: filters.search.trim(), mode: 'insensitive' as const } },
                  {
                    imovel: {
                      titulo: { contains: filters.search.trim(), mode: 'insensitive' as const },
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    }
    const page = Math.max(1, filters.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 10))
    const [rows, totalCount] = await prisma.$transaction([
      prisma.chamadoManutencao.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: ticketInclude,
      }),
      prisma.chamadoManutencao.count({ where }),
    ])
    return {
      items: rows.map((row) => {
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
      totalCount,
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
    const result = await tx.chamadoManutencao.updateMany({
      where: {
        id: ticket.id,
        tenantId: ticket.tenantId,
        updatedAt: ticket.updatedAt,
        excluidoEm: ticket.deletedAt,
      },
      data: {
        ...changes,
        updatedAt: new Date(Math.max(Date.now(), ticket.updatedAt.getTime() + 1)),
      },
    })
    if (result.count !== 1)
      throw new ConflictError('O chamado foi alterado. Atualize a tela e tente novamente.')
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
      await this.lockTicket(tx, ticket, {
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
        ...(changes.provider
          ? {
              prestadorNome: changes.provider.name,
              prestadorTelefone: changes.provider.phone ?? null,
              prestadorEmail: changes.provider.email ?? null,
              prestadorObservacoes: changes.provider.notes ?? null,
            }
          : {}),
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
      await tx.atividadeChamadoManutencao.create({ data: activityData(ticket.id, activity) })
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
      await this.lockTicket(tx, ticket)
      const row = await tx.anexoChamadoManutencao.create({
        data: { chamadoId: ticket.id, nome: attachment.name, url: attachment.url },
      })
      await tx.atividadeChamadoManutencao.create({
        data: activityData(ticket.id, {
          type: 'ANEXO_ADICIONADO',
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
