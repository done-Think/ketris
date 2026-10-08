import type {
  AnexoChamadoManutencao,
  AtividadeChamadoManutencao,
  ChamadoManutencao,
} from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type {
  MaintenanceActivity,
  MaintenanceAttachment,
  MaintenanceProperty,
  MaintenanceTicket,
  MaintenanceTicketListFilters,
  MaintenanceTicketListResult,
  MaintenanceTicketUpdate,
  NewMaintenanceActivity,
  NewMaintenanceTicket,
} from '../domain/maintenance-ticket.entity'
import type { MaintenanceTicketRepository } from '../application/ports/maintenance-ticket-repository.port'

type ChamadoWithRelations = ChamadoManutencao & {
  imovel: { titulo: string }
  atividades: AtividadeChamadoManutencao[]
  anexos: AnexoChamadoManutencao[]
}

function toDomainActivity(row: AtividadeChamadoManutencao): MaintenanceActivity {
  return {
    id: row.id,
    ticketId: row.chamadoId,
    type: row.tipo,
    message: row.mensagem,
    authorId: row.autorId,
    authorName: row.autorNome,
    createdAt: row.createdAt,
  }
}

function toDomainAttachment(row: AnexoChamadoManutencao): MaintenanceAttachment {
  return {
    id: row.id,
    ticketId: row.chamadoId,
    name: row.nome,
    url: row.url,
    createdAt: row.createdAt,
  }
}

function toDomainTicket(chamado: ChamadoWithRelations): MaintenanceTicket {
  return {
    id: chamado.id,
    tenantId: chamado.tenantId,
    propertyId: chamado.imovelId,
    propertyTitle: chamado.imovel.titulo,
    category: chamado.categoria,
    priority: chamado.prioridade,
    status: chamado.status,
    title: chamado.titulo,
    description: chamado.descricao,
    openedById: chamado.abertoPorId,
    openedByName: chamado.abertoPorNome,
    resolvedAt: chamado.resolvidoEm,
    createdAt: chamado.createdAt,
    updatedAt: chamado.updatedAt,
    activities: chamado.atividades.map(toDomainActivity),
    attachments: chamado.anexos.map(toDomainAttachment),
  }
}

const ticketInclude = {
  imovel: { select: { titulo: true } },
  atividades: { orderBy: { createdAt: 'asc' } },
  anexos: true,
} as const

export class PrismaMaintenanceTicketRepository implements MaintenanceTicketRepository {
  async findPropertyForTenant(
    tenantId: string,
    propertyId: string,
  ): Promise<MaintenanceProperty | null> {
    const imovel = await prisma.imovel.findFirst({
      where: { tenantId, id: propertyId },
      select: { id: true, titulo: true },
    })

    return imovel ? { id: imovel.id, title: imovel.titulo } : null
  }

  async create(input: NewMaintenanceTicket): Promise<MaintenanceTicket> {
    const chamado = await prisma.chamadoManutencao.create({
      data: {
        tenantId: input.tenantId,
        imovelId: input.propertyId,
        categoria: input.category,
        prioridade: input.priority,
        titulo: input.title,
        descricao: input.description,
        abertoPorId: input.openedById,
        abertoPorNome: input.openedByName,
      },
      include: ticketInclude,
    })

    return toDomainTicket(chamado)
  }

  async findMany(filters: MaintenanceTicketListFilters): Promise<MaintenanceTicketListResult> {
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1
    const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : 10
    const search = filters.search?.trim()

    const where = {
      tenantId: filters.tenantId,
      status: filters.status,
      imovelId: filters.propertyId,
      ...(search
        ? {
            OR: [
              { titulo: { contains: search, mode: 'insensitive' as const } },
              { categoria: { contains: search, mode: 'insensitive' as const } },
              { imovel: { titulo: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    }

    const [chamados, totalCount] = await Promise.all([
      prisma.chamadoManutencao.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: { imovel: { select: { titulo: true } } },
      }),
      prisma.chamadoManutencao.count({ where }),
    ])

    return {
      items: chamados.map((chamado) => ({
        id: chamado.id,
        propertyId: chamado.imovelId,
        propertyTitle: chamado.imovel.titulo,
        category: chamado.categoria,
        priority: chamado.prioridade,
        status: chamado.status,
        title: chamado.titulo,
        openedByName: chamado.abertoPorNome,
        resolvedAt: chamado.resolvidoEm,
        createdAt: chamado.createdAt,
        updatedAt: chamado.updatedAt,
      })),
      totalCount,
    }
  }

  async findById(tenantId: string, ticketId: string): Promise<MaintenanceTicket | null> {
    const chamado = await prisma.chamadoManutencao.findFirst({
      where: { tenantId, id: ticketId },
      include: ticketInclude,
    })

    return chamado ? toDomainTicket(chamado) : null
  }

  async update(
    tenantId: string,
    ticketId: string,
    changes: MaintenanceTicketUpdate,
  ): Promise<MaintenanceTicket> {
    await prisma.chamadoManutencao.updateMany({
      where: { tenantId, id: ticketId },
      data: {
        imovelId: changes.propertyId,
        categoria: changes.category,
        prioridade: changes.priority,
        titulo: changes.title,
        descricao: changes.description,
      },
    })

    const chamado = await prisma.chamadoManutencao.findFirstOrThrow({
      where: { tenantId, id: ticketId },
      include: ticketInclude,
    })

    return toDomainTicket(chamado)
  }

  async delete(tenantId: string, ticketId: string): Promise<void> {
    await prisma.chamadoManutencao.deleteMany({ where: { tenantId, id: ticketId } })
  }

  async resolve(
    tenantId: string,
    ticketId: string,
    activity: NewMaintenanceActivity,
  ): Promise<MaintenanceTicket> {
    await prisma.$transaction([
      prisma.chamadoManutencao.updateMany({
        where: { tenantId, id: ticketId },
        data: { status: 'RESOLVIDO', resolvidoEm: new Date() },
      }),
      prisma.atividadeChamadoManutencao.create({
        data: {
          chamadoId: ticketId,
          tipo: activity.type,
          mensagem: activity.message,
          autorId: activity.authorId,
          autorNome: activity.authorName,
        },
      }),
    ])

    const chamado = await prisma.chamadoManutencao.findFirstOrThrow({
      where: { tenantId, id: ticketId },
      include: ticketInclude,
    })

    return toDomainTicket(chamado)
  }

  async addNote(
    tenantId: string,
    ticketId: string,
    activity: NewMaintenanceActivity,
  ): Promise<MaintenanceActivity> {
    await prisma.chamadoManutencao.findFirstOrThrow({
      where: { tenantId, id: ticketId },
      select: { id: true },
    })

    const created = await prisma.atividadeChamadoManutencao.create({
      data: {
        chamadoId: ticketId,
        tipo: activity.type,
        mensagem: activity.message,
        autorId: activity.authorId,
        autorNome: activity.authorName,
      },
    })

    return toDomainActivity(created)
  }

  async findActivities(tenantId: string, ticketId: string): Promise<MaintenanceActivity[]> {
    await prisma.chamadoManutencao.findFirstOrThrow({
      where: { tenantId, id: ticketId },
      select: { id: true },
    })

    const rows = await prisma.atividadeChamadoManutencao.findMany({
      where: { chamadoId: ticketId },
      orderBy: { createdAt: 'asc' },
    })

    return rows.map(toDomainActivity)
  }
}
