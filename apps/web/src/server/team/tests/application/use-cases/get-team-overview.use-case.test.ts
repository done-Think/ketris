import { describe, expect, it, vi } from 'vitest'

import { GetTeamOverviewUseCase } from '../../../application/use-cases/get-team-overview.use-case'
import type { TeamMemberRow } from '../../../types/team-repository'
import { owner, teamRepository } from './team-fixtures'

function row(overrides: Partial<TeamMemberRow>): TeamMemberRow {
  return {
    id: 'agent-1',
    name: 'Marina',
    email: 'marina@example.test',
    phone: null,
    avatarUrl: null,
    headline: 'Especialista em Jardins',
    specialties: ['Alto padrão'],
    hasPublicProfile: true,
    active: true,
    invitation: null,
    ...overrides,
  }
}

describe('GetTeamOverviewUseCase', () => {
  it('junta os números do mês, a meta vigente e o ritmo de cada corretor', async () => {
    const repository = teamRepository()
    vi.mocked(repository.listMembers).mockResolvedValue([
      row({}),
      row({ id: 'agent-2', name: 'Thiago' }),
      row({
        id: 'agent-3',
        name: 'Convidada',
        invitation: { status: 'PENDING', sentAt: new Date(), expiresAt: new Date() },
      }),
    ])
    vi.mocked(repository.loadMetrics).mockResolvedValue({
      properties: new Map([
        ['agent-1', 12],
        ['agent-2', 3],
      ]),
      openLeads: new Map([['agent-1', 4]]),
      monthlySales: new Map([['agent-1', 6]]),
      returns: new Map([['agent-1', 9]]),
      responseMinutes: new Map([['agent-1', [30, 10, 20]]]),
      goals: new Map([
        ['agent-1', { monthlySales: 10, setAt: new Date('2026-09-01'), setByName: 'Dona' }],
      ]),
    })
    const now = new Date('2026-10-16T15:00:00.000Z')

    const overview = await new GetTeamOverviewUseCase(repository, () => now).execute(owner)

    expect(overview.month).toBe('2026-10')
    expect(overview.members[0]).toMatchObject({
      metrics: {
        properties: 12,
        openLeads: 4,
        monthlySales: 6,
        returns: 9,
        responseTimeMinutes: 20,
      },
      goal: { monthlySales: 10, setByName: 'Dona' },
      pace: { status: 'AHEAD', goalProgress: 60 },
    })
    expect(overview.members[1]).toMatchObject({
      metrics: { properties: 3, openLeads: 0, monthlySales: 0, responseTimeMinutes: null },
      goal: null,
      pace: { status: 'NO_GOAL' },
    })
    expect(overview.summary).toEqual({
      activeBrokers: 2,
      properties: 15,
      monthlySales: 6,
      averageGoalProgress: 60,
    })
    expect(repository.loadMetrics).toHaveBeenCalledWith(
      'tenant-1',
      ['agent-1', 'agent-2', 'agent-3'],
      expect.objectContaining({
        monthStart: new Date('2026-10-01T03:00:00.000Z'),
        monthEnd: new Date('2026-11-01T03:00:00.000Z'),
        responseWindowStart: new Date('2026-09-16T15:00:00.000Z'),
      }),
    )
  })

  it('bloqueia quem não é OWNER', async () => {
    await expect(
      new GetTeamOverviewUseCase(teamRepository()).execute({ ...owner, actorPapel: 'AGENT' }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
