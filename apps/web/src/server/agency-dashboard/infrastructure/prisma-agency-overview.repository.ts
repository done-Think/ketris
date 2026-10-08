import { prisma } from '@server/db/prisma'

import type {
  AgencyActivity,
  AgencyBrokerSale,
  AgencyTopBroker,
} from '../domain/agency-overview.entity'
import type { AgencyOverviewRepository } from '../application/ports/agency-overview-repository.port'

function monthRange(referenceDate: Date) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1)

  return { start, end }
}

function buildLocation(endereco: { bairro: string; cidade: string } | null): string | null {
  if (!endereco) return null

  const parts = [endereco.bairro, endereco.cidade].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : null
}

const RECENT_ACTIVITY_LIMIT = 10
const PER_SOURCE_ACTIVITY_LIMIT = 5
const TOP_BROKERS_LIMIT = 5
const RECENT_SALES_PER_BROKER_LIMIT = 3

export class PrismaAgencyOverviewRepository implements AgencyOverviewRepository {
  async getPortfolioCount(tenantId: string): Promise<number> {
    return prisma.imovel.count({ where: { tenantId } })
  }

  async getActiveBrokersCount(tenantId: string): Promise<number> {
    return prisma.usuario.count({
      where: { tenantId, papel: { in: ['AGENT', 'OWNER'] }, ativo: true },
    })
  }

  async getReceivedLeadsThisMonth(tenantId: string, referenceDate: Date): Promise<number> {
    const { start, end } = monthRange(referenceDate)

    return prisma.lead.count({
      where: { tenantId, createdAt: { gte: start, lt: end } },
    })
  }

  async getOccupancyPercentage(tenantId: string): Promise<number> {
    const [occupiedCount, listedCount] = await Promise.all([
      prisma.imovel.count({ where: { tenantId, status: { in: ['RENTED', 'SOLD'] } } }),
      prisma.imovel.count({ where: { tenantId, status: { in: ['PUBLISHED', 'RENTED', 'SOLD'] } } }),
    ])

    return listedCount > 0 ? Math.round((occupiedCount / listedCount) * 100) : 0
  }

  async getTopBrokers(tenantId: string): Promise<AgencyTopBroker[]> {
    const activeContracts = await prisma.contrato.findMany({
      where: { tenantId, status: 'ATIVO' },
      orderBy: { ativadoEm: 'desc' },
      include: {
        imovel: {
          select: {
            id: true,
            titulo: true,
            endereco: { select: { bairro: true, cidade: true } },
            responsavel: { select: { id: true, nome: true, avatarUrl: true } },
          },
        },
      },
    })

    const brokerAggregates = new Map<
      string,
      {
        id: string
        name: string
        avatarUrl: string | null
        salesCount: number
        revenueTotal: number
        sales: AgencyBrokerSale[]
      }
    >()

    for (const contrato of activeContracts) {
      const broker = contrato.imovel.responsavel
      const existing = brokerAggregates.get(broker.id) ?? {
        id: broker.id,
        name: broker.nome,
        avatarUrl: broker.avatarUrl,
        salesCount: 0,
        revenueTotal: 0,
        sales: [],
      }

      existing.salesCount += 1
      existing.revenueTotal += contrato.valor.toNumber()
      existing.sales.push({
        id: contrato.id,
        propertyId: contrato.imovel.id,
        propertyTitle: contrato.imovel.titulo,
        location: buildLocation(contrato.imovel.endereco),
        value: contrato.valor.toNumber(),
        closedAt: contrato.ativadoEm ?? contrato.createdAt,
      })

      brokerAggregates.set(broker.id, existing)
    }

    return Array.from(brokerAggregates.values())
      .sort((a, b) => b.revenueTotal - a.revenueTotal)
      .slice(0, TOP_BROKERS_LIMIT)
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        avatarUrl: entry.avatarUrl,
        salesCount: entry.salesCount,
        revenueTotal: entry.revenueTotal,
        recentSales: entry.sales.slice(0, RECENT_SALES_PER_BROKER_LIMIT),
      }))
  }

  async getRecentActivities(tenantId: string): Promise<AgencyActivity[]> {
    const [activatedContracts, newProperties, visitEvents, newLeads] = await Promise.all([
      prisma.contrato.findMany({
        where: { tenantId, ativadoEm: { not: null } },
        orderBy: { ativadoEm: 'desc' },
        take: PER_SOURCE_ACTIVITY_LIMIT,
        include: { imovel: { select: { titulo: true, responsavel: { select: { nome: true } } } } },
      }),
      prisma.imovel.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: PER_SOURCE_ACTIVITY_LIMIT,
        include: { responsavel: { select: { nome: true } } },
      }),
      prisma.eventoAgenda.findMany({
        where: { tenantId, titulo: { contains: 'visita', mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        take: PER_SOURCE_ACTIVITY_LIMIT,
        include: { responsavel: { select: { nome: true } } },
      }),
      prisma.lead.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: PER_SOURCE_ACTIVITY_LIMIT,
        include: { responsavel: { select: { nome: true } } },
      }),
    ])

    const activities: AgencyActivity[] = [
      ...activatedContracts.map((contrato) => ({
        id: contrato.id,
        type: 'CONTRACT' as const,
        brokerName: contrato.imovel.responsavel?.nome ?? '',
        detail: contrato.imovel.titulo,
        occurredAt: contrato.ativadoEm as Date,
      })),
      ...newProperties.map((imovel) => ({
        id: imovel.id,
        type: 'PROPERTY' as const,
        brokerName: imovel.responsavel?.nome ?? '',
        detail: imovel.titulo,
        occurredAt: imovel.createdAt,
      })),
      ...visitEvents.map((evento) => ({
        id: evento.id,
        type: 'VISIT' as const,
        brokerName: evento.responsavel?.nome ?? '',
        detail: evento.titulo,
        occurredAt: evento.createdAt,
      })),
      ...newLeads.map((lead) => ({
        id: lead.id,
        type: 'LEAD' as const,
        brokerName: lead.responsavel?.nome ?? '',
        detail: lead.nome,
        occurredAt: lead.createdAt,
      })),
    ]

    return activities
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, RECENT_ACTIVITY_LIMIT)
  }
}
