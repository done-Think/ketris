import type { TeamMember, TeamOverview } from '../../types/team'

export function teamMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'agent-1',
    name: 'Marina Costa',
    email: 'marina@ketris.dev',
    phone: '(11) 98888-7777',
    avatarUrl: null,
    headline: 'Especialista em alto padrão',
    specialties: ['Alto padrão'],
    hasPublicProfile: true,
    active: true,
    invitation: null,
    metrics: { properties: 7, openLeads: 4, monthlySales: 2, returns: 3, responseTimeMinutes: 95 },
    goal: { monthlySales: 4, setAt: '2026-10-01T12:00:00.000Z', setByName: 'Dona Ana' },
    pace: { status: 'ON_TRACK', expectedSales: 2.3, goalProgress: 50 },
    ...overrides,
  }
}

export function teamOverview(members: TeamMember[]): TeamOverview {
  return {
    month: '2026-10',
    members,
    summary: { activeBrokers: 2, properties: 11, monthlySales: 3, averageGoalProgress: 50 },
  }
}
