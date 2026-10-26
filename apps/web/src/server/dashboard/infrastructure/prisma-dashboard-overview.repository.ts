import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import type { TimeRange } from '@server/shared/types/time-zone-calendar'

import type { DashboardOverviewRepository } from '../application/ports/dashboard-overview-repository.port'
import type {
  DashboardRecentLead,
  DashboardScope,
  DashboardUpcomingActivity,
} from '../types/dashboard-overview'

function leadWhere(scope: DashboardScope): Prisma.LeadWhereInput {
  return {
    tenantId: scope.tenantId,
    ...(scope.agentId ? { responsavelId: scope.agentId } : {}),
  }
}

function startsIn(range: TimeRange): Prisma.DateTimeFilter {
  return { gte: range.start, lt: range.end }
}

// The agent's own events, with the same visibility the agenda gives an AGENT (internal team events
// and events assigned to another agent stay hidden). Events for all agents are not "own work".
function ownEventsWhere(agentId: string): Prisma.EventoAgendaWhereInput {
  return {
    responsavelId: agentId,
    OR: [{ destino: 'SHARED_TEAM', interno: false }, { destino: 'ASSIGNED_AGENT' }],
  }
}

function upcomingEventsWhere(scope: DashboardScope): Prisma.EventoAgendaWhereInput {
  if (!scope.agentId) return { tenantId: scope.tenantId }

  return {
    tenantId: scope.tenantId,
    OR: [ownEventsWhere(scope.agentId), { destino: 'ALL_AGENTS' }],
  }
}

export class PrismaDashboardOverviewRepository implements DashboardOverviewRepository {
  countActiveLeads(scope: DashboardScope, createdIn?: TimeRange): Promise<number> {
    return prisma.lead.count({
      where: {
        ...leadWhere(scope),
        oportunidadeId: null,
        ...(createdIn ? { createdAt: startsIn(createdIn) } : {}),
      },
    })
  }

  countVisits(scope: DashboardScope, range: TimeRange): Promise<number> {
    return prisma.eventoAgenda.count({
      where: {
        tenantId: scope.tenantId,
        tipo: 'VISIT',
        status: { not: 'CANCELLED' },
        inicio: startsIn(range),
        ...(scope.agentId ? ownEventsWhere(scope.agentId) : {}),
      },
    })
  }

  countOpenProposals(scope: DashboardScope, onlyAwaitingResponse: boolean): Promise<number> {
    return prisma.oportunidade.count({
      where: {
        tenantId: scope.tenantId,
        arquivadaEm: null,
        status: { in: onlyAwaitingResponse ? ['ENVIADA'] : ['ENVIADA', 'EM_NEGOCIACAO'] },
        ...(scope.agentId ? { imovel: { responsavelId: scope.agentId } } : {}),
      },
    })
  }

  async findRecentLeads(scope: DashboardScope, limit: number): Promise<DashboardRecentLead[]> {
    const rows = await prisma.lead.findMany({
      where: leadWhere(scope),
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return rows.map((row) => ({
      id: row.id,
      name: row.nome,
      phone: row.telefone,
      interest: row.interesse,
      budget: row.orcamento,
      source: row.origem,
      stage: row.estagio,
      notes: row.observacoes,
      createdAt: row.createdAt,
    }))
  }

  async findUpcomingActivities(
    scope: DashboardScope,
    from: Date,
    limit: number,
  ): Promise<DashboardUpcomingActivity[]> {
    const rows = await prisma.eventoAgenda.findMany({
      where: {
        ...upcomingEventsWhere(scope),
        status: { not: 'CANCELLED' },
        inicio: { gte: from },
      },
      orderBy: { inicio: 'asc' },
      take: limit,
    })

    return rows.map((row) => ({
      id: row.id,
      title: row.titulo,
      kind: row.tipo,
      start: row.inicio,
      end: row.fim,
      participantName: row.participanteNome,
      participantPhone: row.participanteTelefone,
      notes: row.notas,
      propertyId: row.imovelId,
      propertyReference: row.referenciaImovelLivre,
    }))
  }
}
