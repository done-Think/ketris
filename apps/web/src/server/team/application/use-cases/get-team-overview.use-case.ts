import { calendarMonthInTimeZone, monthBoundsInTimeZone } from '@server/shared/time-zone-calendar'

import { median, monthElapsedFraction, teamMemberPace } from '../../domain/team-pace'
import type { TeamActor, TeamMember, TeamOverview, TeamPeriod } from '../../types/team'
import type { TeamRepository } from '../ports/team-repository.port'
import { assertTeamManager } from '../team-access'

const RESPONSE_WINDOW_DAYS = 30

export class GetTeamOverviewUseCase {
  constructor(
    private readonly repository: TeamRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: TeamActor): Promise<TeamOverview> {
    assertTeamManager(actor)
    const now = this.now()
    const { start, end } = monthBoundsInTimeZone(now)
    const period: TeamPeriod = {
      now,
      monthStart: start,
      monthEnd: end,
      responseWindowStart: new Date(now.getTime() - RESPONSE_WINDOW_DAYS * 24 * 60 * 60 * 1000),
    }
    const rows = await this.repository.listMembers(actor.actorTenantId)
    const metrics = await this.repository.loadMetrics(
      actor.actorTenantId,
      rows.map((row) => row.id),
      period,
    )
    const elapsed = monthElapsedFraction(now, start, end)
    const members: TeamMember[] = rows.map((row) => {
      const goal = metrics.goals.get(row.id) ?? null
      const monthlySales = metrics.monthlySales.get(row.id) ?? 0

      return {
        ...row,
        metrics: {
          properties: metrics.properties.get(row.id) ?? 0,
          openLeads: metrics.openLeads.get(row.id) ?? 0,
          openOpportunities: metrics.openOpportunities.get(row.id) ?? 0,
          monthlySales,
          returns: metrics.returns.get(row.id) ?? 0,
          responseTimeMinutes: median(metrics.responseMinutes.get(row.id) ?? []),
        },
        goal,
        pace: teamMemberPace(monthlySales, goal?.monthlySales ?? null, elapsed),
      }
    })
    const working = members.filter((member) => member.active && !member.invitation)
    const progresses = working.flatMap((member) =>
      member.pace.goalProgress === null ? [] : [member.pace.goalProgress],
    )
    const { year, month } = calendarMonthInTimeZone(now)

    return {
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      members,
      summary: {
        activeBrokers: working.length,
        properties: working.reduce((total, member) => total + member.metrics.properties, 0),
        monthlySales: members.reduce((total, member) => total + member.metrics.monthlySales, 0),
        averageGoalProgress: progresses.length
          ? Math.round(progresses.reduce((total, value) => total + value, 0) / progresses.length)
          : null,
      },
    }
  }
}
