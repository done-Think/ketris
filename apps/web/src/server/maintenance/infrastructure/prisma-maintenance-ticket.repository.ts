import type { MaintenanceUserLinkInput } from '../types/maintenance-ticket'
import type {
  MaintenanceContractRow,
  MaintenanceTicketRow,
} from '../types/prisma-maintenance-ticket-repository'
import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { MaintenancePropertyNotFoundError } from '../domain/errors'
import type {
  MaintenanceActor,
  MaintenanceActivity,
  MaintenanceAttachment,
  MaintenanceContract,
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
import { assertAdmin, permissionsFor } from '../application/authorization'

const contractInclude = { imovel: true, partes: true } as const
const ticketInclude = {
  imovel: true,
  contrato: { include: contractInclude },
  responsavel: { select: { nome: true } },
  atividades: { orderBy: { createdAt: 'asc' as const } },
  anexos: true,
  solicitacoesTroca: { orderBy: { createdAt: 'desc' as const } },
}

function toContract(row: MaintenanceContractRow): MaintenanceContract {
  return {
    id: row.id,
    code: row.codigo,
    propertyId: row.imovelId,
    propertyTitle: row.imovel.titulo,
    agentId: row.imovel.responsavelId,
    ownerId: row.imovel.proprietarioId,
    renterIds: row.partes
      .filter((p) => p.papel === 'LOCATARIO' && p.usuarioId)
      .map((p) => p.usuarioId!),
    parties: row.partes.map((p) => ({
      id: p.id,
      name: p.nome,
      role: p.papel,
      userId: p.usuarioId,
    })),
  }
}
function toActivity(row: MaintenanceTicketRow['atividades'][number]): MaintenanceActivity {
  return {
    id: row.id,
    ticketId: row.chamadoId,
    type: row.tipo,
    message: row.mensagem,
    authorId: row.autorId,
    authorName: row.autorNome,
    createdAt: row.createdAt,
    details: row.detalhes as Record<string, unknown> | null,
  }
}
function toAttachment(row: MaintenanceTicketRow['anexos'][number]): MaintenanceAttachment {
  return {
    id: row.id,
    ticketId: row.chamadoId,
    name: row.nome,
    url: row.url,
    createdAt: row.createdAt,
  }
}
function toTicket(row: MaintenanceTicketRow): MaintenanceTicket {
  const contract = row.contrato ? toContract(row.contrato) : null
  return {
    id: row.id,
    tenantId: row.tenantId,
    propertyId: row.imovelId,
    propertyTitle: row.imovel.titulo,
    contractId: row.contratoId,
    responsibleId: row.responsavelId,
    responsibleName: row.responsavel?.nome ?? null,
    provider: row.prestadorNome
      ? {
          name: row.prestadorNome,
          phone: row.prestadorTelefone,
          email: row.prestadorEmail,
          notes: row.prestadorObservacoes,
        }
      : null,
    completedByRole: row.concluidoPorPapel,
    deletedAt: row.excluidoEm,
    category: row.categoria,
    priority: row.prioridade,
    status: row.status,
    title: row.titulo,
    description: row.descricao,
    openedById: row.abertoPorId,
    openedByName: row.abertoPorNome,
    resolvedAt: row.resolvidoEm,
    scheduledAt: row.atendimentoEm,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    activities: row.atividades.map(toActivity),
    attachments: row.anexos.map(toAttachment),
    replacementRequests: row.solicitacoesTroca.map((r) => ({
      id: r.id,
      reason: r.justificativa,
      requestedById: r.solicitanteId,
      requestedByName: r.solicitanteNome,
      status: r.status,
      decisionReason: r.decisaoJustificativa,
      decidedByName: r.decididoPorNome,
      decidedAt: r.decididoEm,
      createdAt: r.createdAt,
    })),
    access: {
      agentId: row.imovel.responsavelId,
      ownerId: row.imovel.proprietarioId,
      renterIds: contract?.renterIds ?? [],
      validContract: Boolean(
        contract &&
        contract.propertyId === row.imovelId &&
        row.contrato?.tenantId === row.tenantId &&
        row.imovel.tenantId === row.tenantId,
      ),
    },
  }
}
export function maintenanceTicketScope(
  actor: MaintenanceActor,
): Prisma.ChamadoManutencaoWhereInput {
  const base: Prisma.ChamadoManutencaoWhereInput = { tenantId: actor.actorTenantId }
  if (actor.actorPapel === 'ADMIN') return base
  base.excluidoEm = null
  base.contrato = { is: { tenantId: actor.actorTenantId } }
  if (actor.actorPapel === 'AGENT')
    base.OR = [
      { responsavelId: actor.actorId },
      { imovel: { responsavelId: actor.actorId, tenantId: actor.actorTenantId } },
    ]
  else if (actor.actorPapel === 'OWNER')
    base.OR = [
      { responsavelId: actor.actorId },
      { imovel: { proprietarioId: actor.actorId, tenantId: actor.actorTenantId } },
    ]
  else if (actor.actorPapel === 'RENTER')
    base.contrato = {
      is: {
        tenantId: actor.actorTenantId,
        partes: { some: { papel: 'LOCATARIO', usuarioId: actor.actorId } },
      },
    }
  else base.id = { in: [] }
  return base
}
function activityData(
  ticketId: string,
  activity: NewMaintenanceActivity,
): Prisma.AtividadeChamadoManutencaoUncheckedCreateInput {
  return {
    chamadoId: ticketId,
    tipo: activity.type,
    mensagem: activity.message,
    autorId: activity.authorId,
    autorNome: activity.authorName,
    ...(activity.details
      ? { detalhes: JSON.parse(JSON.stringify(activity.details)) as Prisma.InputJsonObject }
      : {}),
  }
}

export class PrismaMaintenanceTicketRepository implements MaintenanceTicketRepository {
  async findContract(tenantId: string, contractId: string) {
    const row = await prisma.contrato.findFirst({
      where: { id: contractId, tenantId, imovel: { tenantId } },
      include: contractInclude,
    })
    return row ? toContract(row) : null
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
    else if (actor.actorPapel === 'OWNER')
      where.imovel = { tenantId: actor.actorTenantId, proprietarioId: actor.actorId }
    else if (actor.actorPapel === 'RENTER')
      where.partes = { some: { papel: 'LOCATARIO', usuarioId: actor.actorId } }
    else if (actor.actorPapel !== 'ADMIN') throw new ForbiddenError()
    const contracts = await prisma.contrato.findMany({
      where,
      include: contractInclude,
      orderBy: { codigo: 'asc' },
    })
    const users =
      actor.actorPapel === 'ADMIN'
        ? await prisma.usuario.findMany({
            where: { tenantId: actor.actorTenantId, ativo: true },
            select: { id: true, nome: true, papel: true },
            orderBy: { nome: 'asc' },
          })
        : []
    return {
      contracts: contracts.map(toContract),
      users: users.map((u) => ({ id: u.id, name: u.nome, role: u.papel })),
    }
  }
  async linkUsers(actor: MaintenanceActor, input: MaintenanceUserLinkInput) {
    assertAdmin(actor)
    await prisma.$transaction(
      async (tx) => {
        const contract = await tx.contrato.findFirst({
          where: {
            id: input.contractId,
            tenantId: actor.actorTenantId,
            imovel: { tenantId: actor.actorTenantId },
          },
          include: contractInclude,
        })
        if (!contract) throw new ForbiddenError()
        if (input.ownerId) {
          const user = await tx.usuario.findFirst({
            where: {
              id: input.ownerId,
              tenantId: actor.actorTenantId,
              papel: 'OWNER',
              ativo: true,
            },
          })
          if (!user) throw new ForbiddenError('Proprietario invalido.')
          await tx.imovel.update({
            where: { id: contract.imovelId },
            data: { proprietarioId: user.id },
          })
        }
        if (input.renterId && input.partyId) {
          const user = await tx.usuario.findFirst({
            where: {
              id: input.renterId,
              tenantId: actor.actorTenantId,
              papel: 'RENTER',
              ativo: true,
            },
          })
          const party = contract.partes.find(
            (p) => p.id === input.partyId && p.papel === 'LOCATARIO',
          )
          if (!user || !party) throw new ForbiddenError('Vinculo de locatario invalido.')
          await tx.parteContrato.update({ where: { id: party.id }, data: { usuarioId: user.id } })
        }
        const tickets = await tx.chamadoManutencao.findMany({
          where: { tenantId: actor.actorTenantId, imovelId: contract.imovelId },
          select: { id: true, updatedAt: true },
        })
        for (const ticket of tickets) {
          await tx.chamadoManutencao.update({
            where: { id: ticket.id },
            data: { updatedAt: new Date(Math.max(Date.now(), ticket.updatedAt.getTime() + 1)) },
          })
          await tx.atividadeChamadoManutencao.create({
            data: activityData(ticket.id, {
              type: 'EDICAO',
              message: 'Vinculos de acesso regularizados pelo administrador.',
              authorId: actor.actorId,
              authorName: actor.actorName,
              details: {
                contractId: contract.id,
                before: {
                  ownerId: contract.imovel.proprietarioId,
                  parties: contract.partes.map((p) => ({ id: p.id, userId: p.usuarioId })),
                },
                after: input,
              },
            }),
          })
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
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
    const where: Prisma.ChamadoManutencaoWhereInput = {
      AND: [
        scope,
        {
          tenantId: filters.tenantId,
          excluidoEm: filters.archived ? { not: null } : null,
          status: filters.status,
          prioridade: filters.priority,
          imovelId: filters.propertyId,
        },
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
  async findById(tenantId: string, ticketId: string, includeDeleted = false) {
    const row = await prisma.chamadoManutencao.findFirst({
      where: { tenantId, id: ticketId, ...(includeDeleted ? {} : { excluidoEm: null }) },
      include: ticketInclude,
    })
    return row ? toTicket(row) : null
  }
  async findAttachmentTicket(tenantId: string, url: string) {
    const row = await prisma.chamadoManutencao.findFirst({
      where: { tenantId, anexos: { some: { url } } },
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
