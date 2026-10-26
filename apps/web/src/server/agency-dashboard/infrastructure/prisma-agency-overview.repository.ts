import { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { AgencyActivity, AgencyBrokerSale, AgencyTopBroker } from '../types/agency-overview'
import type { AgencyOverviewRepository } from '../application/ports/agency-overview-repository.port'
import {
  currentMonthRange,
  previousMonthDueDateRange,
  previousMonthSamePeriodRange,
} from '../domain/agency-overview-periods'

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

  async getNewPropertiesThisMonth(tenantId: string, referenceDate: Date): Promise<number> {
    const { start, end } = currentMonthRange(referenceDate)

    return prisma.imovel.count({
      where: { tenantId, createdAt: { gte: start, lt: end } },
    })
  }

  async getActiveBrokersCount(tenantId: string): Promise<number> {
    return prisma.usuario.count({
      where: { tenantId, papel: { in: ['AGENT', 'OWNER'] }, ativo: true },
    })
  }

  async getReceivedLeadsThisMonth(tenantId: string, referenceDate: Date): Promise<number> {
    const { start, end } = currentMonthRange(referenceDate)

    return prisma.lead.count({
      where: { tenantId, createdAt: { gte: start, lt: end } },
    })
  }

  async getReceivedLeadsPreviousPeriod(tenantId: string, referenceDate: Date): Promise<number> {
    const { start, end } = previousMonthSamePeriodRange(referenceDate)

    return prisma.lead.count({
      where: { tenantId, createdAt: { gte: start, lt: end } },
    })
  }

  async getMonthlyReceivablePreviousMonth(tenantId: string, referenceDate: Date): Promise<number> {
    const { start, end } = previousMonthDueDateRange(referenceDate)
    const aggregate = await prisma.cobranca.aggregate({
      _sum: { valor: true },
      where: {
        tenantId,
        tipo: 'A_RECEBER',
        vencimento: { gte: start, lt: end },
        status: { in: ['PENDENTE', 'PAGA'] },
      },
    })

    return aggregate._sum.valor?.toNumber() ?? 0
  }

  async getOccupancyPercentage(tenantId: string): Promise<number> {
    const [occupiedCount, listedCount] = await Promise.all([
      prisma.imovel.count({ where: { tenantId, status: { in: ['RENTED', 'SOLD'] } } }),
      prisma.imovel.count({ where: { tenantId, status: { in: ['PUBLISHED', 'RENTED', 'SOLD'] } } }),
    ])

    return listedCount > 0 ? Math.round((occupiedCount / listedCount) * 100) : 0
  }

  async getTopBrokers(tenantId: string): Promise<AgencyTopBroker[]> {
    const ranking = await prisma.$queryRaw<
      { brokerId: string; salesCount: number; revenueTotal: Prisma.Decimal | number | string }[]
    >(Prisma.sql`
      SELECT i."responsavelId" AS "brokerId",
             COUNT(*)::int AS "salesCount",
             SUM(c."valor") AS "revenueTotal"
      FROM "contratos" c
      JOIN "imoveis" i ON i."id" = c."imovelId"
      WHERE c."tenantId" = ${tenantId} AND c."status" = 'ATIVO'
      GROUP BY i."responsavelId"
      ORDER BY "revenueTotal" DESC, MAX(COALESCE(c."ativadoEm", c."createdAt")) DESC
      LIMIT ${TOP_BROKERS_LIMIT}
    `)

    if (ranking.length === 0) return []

    const brokerIds = ranking.map((entry) => entry.brokerId)
    const [brokers, recentSalesByBroker] = await Promise.all([
      prisma.usuario.findMany({
        where: { id: { in: brokerIds } },
        select: {
          id: true,
          nome: true,
          avatarUrl: true,
          perfilPublico: { select: { status: true } },
        },
      }),
      Promise.all(
        brokerIds.map((brokerId) =>
          prisma.contrato.findMany({
            where: { tenantId, status: 'ATIVO', imovel: { responsavelId: brokerId } },
            orderBy: { ativadoEm: 'desc' },
            take: RECENT_SALES_PER_BROKER_LIMIT,
            include: {
              imovel: {
                select: {
                  id: true,
                  titulo: true,
                  endereco: { select: { bairro: true, cidade: true } },
                },
              },
            },
          }),
        ),
      ),
    ])
    const brokersById = new Map(brokers.map((broker) => [broker.id, broker]))

    return ranking.flatMap((entry, index) => {
      const broker = brokersById.get(entry.brokerId)
      if (!broker) return []

      return [
        {
          id: broker.id,
          name: broker.nome,
          avatarUrl: broker.avatarUrl,
          hasPublicProfile: broker.perfilPublico?.status === 'PUBLISHED',
          salesCount: entry.salesCount,
          revenueTotal: Number(entry.revenueTotal),
          recentSales: recentSalesByBroker[index].map((contrato): AgencyBrokerSale => ({
            id: contrato.id,
            propertyId: contrato.imovel.id,
            propertyTitle: contrato.imovel.titulo,
            location: buildLocation(contrato.imovel.endereco),
            value: contrato.valor.toNumber(),
            closedAt: contrato.ativadoEm ?? contrato.createdAt,
          })),
        },
      ]
    })
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
        where: { tenantId, tipo: 'VISIT' },
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
