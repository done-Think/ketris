import { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import { recordUserAudit } from '@server/auth/infrastructure/user-audit'

import type { TeamRepository } from '../application/ports/team-repository.port'
import type { TeamGoalChange, TeamPeriod, TeamTransferResult } from '../types/team'
import type {
  TeamMemberRow,
  TeamMetricRows,
  TeamStaffUser,
  TeamTransferCommand,
} from '../types/team-repository'

const staffRoles = ['AGENT', 'OWNER'] as const

const openOpportunityWhere = {
  arquivadaEm: null,
  status: { not: 'RECUSADA' },
  contrato: { is: null },
} satisfies Prisma.OportunidadeWhereInput

function countMap(rows: { key: string | null; count: number }[]): Map<string, number> {
  return new Map(rows.flatMap((row) => (row.key ? [[row.key, row.count] as const] : [])))
}

async function moveItems(
  tx: Prisma.TransactionClient,
  { tenantId, sourceId, destinationId, items, opportunityScope, now }: TeamTransferCommand,
): Promise<TeamTransferResult> {
  const [properties, leads, opportunities, events] = await Promise.all([
    items.properties
      ? tx.imovel.findMany({ where: { tenantId, responsavelId: sourceId }, select: { id: true } })
      : [],
    items.leads
      ? tx.lead.findMany({ where: { tenantId, responsavelId: sourceId }, select: { id: true } })
      : [],
    items.opportunities
      ? tx.oportunidade.findMany({
          where: {
            tenantId,
            responsavelId: sourceId,
            ...(opportunityScope === 'open' ? openOpportunityWhere : {}),
          },
          select: { id: true },
        })
      : [],
    items.futureEvents
      ? tx.eventoAgenda.findMany({
          where: {
            tenantId,
            responsavelId: sourceId,
            inicio: { gte: now },
            status: { not: 'CANCELLED' },
          },
          select: { id: true },
        })
      : [],
  ])
  const result = {
    propertyIds: properties.map(({ id }) => id),
    leadIds: leads.map(({ id }) => id),
    opportunityIds: opportunities.map(({ id }) => id),
    eventIds: events.map(({ id }) => id),
  }
  await Promise.all([
    result.propertyIds.length
      ? tx.imovel.updateMany({
          where: { tenantId, id: { in: result.propertyIds } },
          data: { responsavelId: destinationId },
        })
      : null,
    result.leadIds.length
      ? tx.lead.updateMany({
          where: { tenantId, id: { in: result.leadIds } },
          data: { responsavelId: destinationId },
        })
      : null,
    result.opportunityIds.length
      ? tx.oportunidade.updateMany({
          where: { tenantId, id: { in: result.opportunityIds } },
          data: { responsavelId: destinationId },
        })
      : null,
    result.eventIds.length
      ? tx.eventoAgenda.updateMany({
          where: { tenantId, id: { in: result.eventIds } },
          data: { responsavelId: destinationId },
        })
      : null,
    result.eventIds.length
      ? tx.eventoAgenda.updateMany({
          where: { tenantId, id: { in: result.eventIds }, donoUsuarioId: sourceId },
          data: { donoUsuarioId: destinationId },
        })
      : null,
  ])

  return result
}

async function recordTransfer(
  tx: Prisma.TransactionClient,
  command: TeamTransferCommand,
  result: TeamTransferResult,
) {
  const people = await tx.usuario.findMany({
    where: { tenantId: command.tenantId, id: { in: [command.sourceId, command.destinationId] } },
    select: { id: true, nome: true },
  })
  const nameOf = (id: string) => people.find((person) => person.id === id)?.nome ?? ''
  await tx.transferenciaCarteira.create({
    data: {
      tenantId: command.tenantId,
      motivo: command.reason,
      origemId: command.sourceId,
      origemNome: nameOf(command.sourceId),
      destinoId: command.destinationId,
      destinoNome: nameOf(command.destinationId),
      autorId: command.actor.id,
      autorNome: command.actor.name,
      imovelIds: result.propertyIds,
      leadIds: result.leadIds,
      eventoIds: result.eventIds,
      oportunidadeIds: result.opportunityIds,
    },
  })
}

export class PrismaTeamRepository implements TeamRepository {
  async listMembers(tenantId: string): Promise<TeamMemberRow[]> {
    const users = await prisma.usuario.findMany({
      where: {
        tenantId,
        papel: 'AGENT',
        OR: [{ vinculoAprovadoEm: { not: null } }, { conviteEquipe: { isNot: null } }],
      },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        avatarUrl: true,
        ativo: true,
        perfilPublico: {
          select: { headline: true, especialidades: true, telefone: true, status: true },
        },
        conviteEquipe: { select: { enviadoEm: true, expiraEm: true, aceitoEm: true } },
      },
    })
    const now = Date.now()

    return users.map((user) => {
      const invitation = user.conviteEquipe
      const pending = invitation && !invitation.aceitoEm

      return {
        id: user.id,
        name: user.nome,
        email: user.email,
        phone: user.telefone ?? user.perfilPublico?.telefone ?? null,
        avatarUrl: user.avatarUrl,
        headline: user.perfilPublico?.headline ?? null,
        specialties: user.perfilPublico?.especialidades ?? [],
        hasPublicProfile: user.perfilPublico?.status === 'PUBLISHED',
        active: user.ativo,
        invitation: pending
          ? {
              status: invitation.expiraEm.getTime() < now ? 'EXPIRED' : 'PENDING',
              sentAt: invitation.enviadoEm,
              expiresAt: invitation.expiraEm,
            }
          : null,
      }
    })
  }

  async loadMetrics(
    tenantId: string,
    memberIds: string[],
    period: TeamPeriod,
  ): Promise<TeamMetricRows> {
    if (!memberIds.length)
      return {
        properties: new Map(),
        openLeads: new Map(),
        openOpportunities: new Map(),
        monthlySales: new Map(),
        returns: new Map(),
        responseMinutes: new Map(),
        goals: new Map(),
      }
    const ids = Prisma.join(memberIds)
    const [
      properties,
      openLeads,
      openOpportunities,
      sales,
      returns,
      leadResponses,
      opportunityResponses,
      goals,
    ] = await Promise.all([
      prisma.imovel.groupBy({
        by: ['responsavelId'],
        where: { tenantId, responsavelId: { in: memberIds }, status: { not: 'INACTIVE' } },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ['responsavelId'],
        where: { tenantId, responsavelId: { in: memberIds }, oportunidadeId: null },
        _count: { _all: true },
      }),
      prisma.oportunidade.groupBy({
        by: ['responsavelId'],
        where: {
          tenantId,
          responsavelId: { in: memberIds },
          ...openOpportunityWhere,
        },
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ key: string; count: number }[]>`
          SELECT o."responsavelId" AS key, COUNT(*)::int AS count
          FROM contratos c JOIN oportunidades o ON o.id = c."oportunidadeOrigemId"
          WHERE c."tenantId" = ${tenantId} AND o."responsavelId" IN (${ids})
            AND c."ativadoEm" >= ${period.monthStart} AND c."ativadoEm" < ${period.monthEnd}
            AND c.status::text <> 'CANCELADO'
          GROUP BY o."responsavelId"`,
      prisma.atividadeOportunidade.groupBy({
        by: ['autorId'],
        where: {
          tipo: 'CONTATO_REALIZADO',
          autorId: { in: memberIds },
          createdAt: { gte: period.monthStart, lt: period.monthEnd },
          oportunidade: { tenantId },
        },
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ key: string; minutes: number }[]>`
          SELECT "responsavelId" AS key,
                 EXTRACT(EPOCH FROM ("primeiroContatoEm" - "createdAt")) / 60 AS minutes
          FROM leads
          WHERE "tenantId" = ${tenantId} AND "responsavelId" IN (${ids})
            AND "createdAt" >= ${period.responseWindowStart} AND "primeiroContatoEm" IS NOT NULL`,
      prisma.$queryRaw<{ key: string; minutes: number }[]>`
          SELECT o."responsavelId" AS key,
                 EXTRACT(EPOCH FROM (MIN(a."createdAt") - o."createdAt")) / 60 AS minutes
          FROM oportunidades o
          JOIN atividades_oportunidade a
            ON a."oportunidadeId" = o.id AND a."autorId" = o."responsavelId"
          WHERE o."tenantId" = ${tenantId} AND o."responsavelId" IN (${ids})
            AND o."createdAt" >= ${period.responseWindowStart}
          GROUP BY o.id, o."responsavelId", o."createdAt"`,
      prisma.metaCorretor.findMany({
        where: { tenantId, usuarioId: { in: memberIds } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        distinct: ['usuarioId'],
      }),
    ])
    const responseMinutes = new Map<string, number[]>()
    for (const row of [...leadResponses, ...opportunityResponses]) {
      const minutes = Math.max(0, Number(row.minutes))
      responseMinutes.set(row.key, [...(responseMinutes.get(row.key) ?? []), minutes])
    }

    return {
      properties: countMap(
        properties.map((row) => ({ key: row.responsavelId, count: row._count._all })),
      ),
      openLeads: countMap(
        openLeads.map((row) => ({ key: row.responsavelId, count: row._count._all })),
      ),
      openOpportunities: countMap(
        openOpportunities.map((row) => ({ key: row.responsavelId, count: row._count._all })),
      ),
      monthlySales: countMap(sales),
      returns: countMap(returns.map((row) => ({ key: row.autorId, count: row._count._all }))),
      responseMinutes,
      goals: new Map(
        goals.map((goal) => [
          goal.usuarioId,
          {
            monthlySales: goal.vendasMensais,
            setAt: goal.createdAt,
            setByName: goal.definidoPorNome,
          },
        ]),
      ),
    }
  }

  async findStaffUser(tenantId: string, userId: string): Promise<TeamStaffUser | null> {
    const user = await prisma.usuario.findFirst({
      where: { tenantId, id: userId, papel: { in: [...staffRoles] } },
      select: {
        id: true,
        nome: true,
        papel: true,
        ativo: true,
        conviteEquipe: { select: { aceitoEm: true } },
      },
    })

    return user
      ? {
          id: user.id,
          name: user.nome,
          papel: user.papel,
          active: user.ativo,
          pendingInvitation: Boolean(user.conviteEquipe && !user.conviteEquipe.aceitoEm),
        }
      : null
  }

  async transfer(command: TeamTransferCommand): Promise<TeamTransferResult> {
    return prisma.$transaction(async (tx) => {
      const result = await moveItems(tx, command)
      await recordTransfer(tx, command, result)
      return result
    })
  }

  async deactivateWithTransfer(command: TeamTransferCommand): Promise<TeamTransferResult> {
    return prisma.$transaction(async (tx) => {
      const result = await moveItems(tx, command)
      await recordTransfer(tx, command, result)
      await tx.usuario.updateMany({
        where: { tenantId: command.tenantId, id: command.sourceId },
        data: { ativo: false, versaoSessao: { increment: 1 } },
      })
      await tx.refreshToken.updateMany({
        where: { userId: command.sourceId, tenantId: command.tenantId, revokedAt: null },
        data: { revokedAt: command.now },
      })
      await recordUserAudit(tx, {
        userId: command.sourceId,
        tenantId: command.tenantId,
        action: 'DEACTIVATED',
        actor: { kind: 'USER', id: command.actor.id },
        changedFields: ['active'],
      })
      return result
    })
  }

  async activate(tenantId: string, userId: string, actorId: string): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.usuario.updateMany({
        where: { tenantId, id: userId, ativo: false },
        data: { ativo: true },
      })
      if (count)
        await recordUserAudit(tx, {
          userId,
          tenantId,
          action: 'UPDATED',
          actor: { kind: 'USER', id: actorId },
          changedFields: ['active'],
        })
      return count > 0
    })
  }

  async setGoal(
    tenantId: string,
    userId: string,
    monthlySales: number,
    actor: { id: string; name: string },
  ): Promise<TeamGoalChange> {
    const goal = await prisma.metaCorretor.create({
      data: {
        tenantId,
        usuarioId: userId,
        vendasMensais: monthlySales,
        definidoPorId: actor.id,
        definidoPorNome: actor.name,
      },
    })

    return {
      id: goal.id,
      monthlySales: goal.vendasMensais,
      setAt: goal.createdAt,
      setByName: goal.definidoPorNome,
    }
  }

  async listGoals(tenantId: string, userId: string, limit: number): Promise<TeamGoalChange[]> {
    const goals = await prisma.metaCorretor.findMany({
      where: { tenantId, usuarioId: userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    })

    return goals.map((goal) => ({
      id: goal.id,
      monthlySales: goal.vendasMensais,
      setAt: goal.createdAt,
      setByName: goal.definidoPorNome,
    }))
  }
}
