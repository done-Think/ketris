import type { TeamGoalChange, TeamOverview, TeamTransferResult } from '../types/team'

export function toTeamOverviewResponse(overview: TeamOverview) {
  return {
    ...overview,
    members: overview.members.map((member) => ({
      ...member,
      invitation: member.invitation
        ? {
            status: member.invitation.status,
            sentAt: member.invitation.sentAt.toISOString(),
            expiresAt: member.invitation.expiresAt.toISOString(),
          }
        : null,
      goal: member.goal ? { ...member.goal, setAt: member.goal.setAt.toISOString() } : null,
    })),
  }
}

export function toTeamGoalChangeResponse(goal: TeamGoalChange) {
  return { ...goal, setAt: goal.setAt.toISOString() }
}

export function toTeamTransferResponse(result: TeamTransferResult) {
  return {
    properties: result.propertyIds.length,
    leads: result.leadIds.length,
    opportunities: result.opportunityIds.length,
    futureEvents: result.eventIds.length,
  }
}
