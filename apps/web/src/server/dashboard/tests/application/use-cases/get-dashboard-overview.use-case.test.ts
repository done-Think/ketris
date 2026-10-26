import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import type { DashboardOverviewRepository } from '../../../application/ports/dashboard-overview-repository.port'
import {
  DASHBOARD_RECENT_LEADS_LIMIT,
  DASHBOARD_UPCOMING_ACTIVITIES_LIMIT,
  GetDashboardOverviewUseCase,
} from '../../../application/use-cases/get-dashboard-overview.use-case'

const now = new Date('2026-10-15T15:00:00.000Z')
const today = {
  start: new Date('2026-10-15T03:00:00.000Z'),
  end: new Date('2026-10-16T03:00:00.000Z'),
}
const month = {
  start: new Date('2026-10-01T03:00:00.000Z'),
  end: new Date('2026-11-01T03:00:00.000Z'),
}

function createRepository(): DashboardOverviewRepository {
  return {
    countActiveLeads: vi.fn(async (_scope, createdIn) => (createdIn ? 2 : 7)),
    countVisits: vi.fn(async (_scope, range) =>
      range.start.getTime() === month.start.getTime() ? 5 : 1,
    ),
    countOpenProposals: vi.fn(async (_scope, onlyAwaitingResponse) =>
      onlyAwaitingResponse ? 3 : 4,
    ),
    findRecentLeads: vi.fn().mockResolvedValue([]),
    findUpcomingActivities: vi.fn().mockResolvedValue([]),
  }
}

describe('GetDashboardOverviewUseCase', () => {
  it('agrega as métricas no fuso de São Paulo e limita as listas', async () => {
    const repository = createRepository()
    const useCase = new GetDashboardOverviewUseCase(repository, () => now)

    const overview = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorPapel: 'AGENT',
    })

    expect(overview.metrics).toEqual({
      activeLeads: 7,
      activeLeadsCreatedToday: 2,
      visitsThisMonth: 5,
      visitsToday: 1,
      openProposals: 4,
      proposalsAwaitingResponse: 3,
    })

    const scope = { tenantId: 'tenant-1', agentId: 'agent-1' }
    expect(repository.countActiveLeads).toHaveBeenCalledWith(scope, today)
    expect(repository.countVisits).toHaveBeenCalledWith(scope, month)
    expect(repository.countVisits).toHaveBeenCalledWith(scope, today)
    expect(repository.findRecentLeads).toHaveBeenCalledWith(scope, DASHBOARD_RECENT_LEADS_LIMIT)
    expect(repository.findUpcomingActivities).toHaveBeenCalledWith(
      scope,
      now,
      DASHBOARD_UPCOMING_ACTIVITIES_LIMIT,
    )
  })

  it('não consulta nada para quem não é da equipe da imobiliária', async () => {
    const repository = createRepository()
    const useCase = new GetDashboardOverviewUseCase(repository, () => now)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorId: 'renter-1', actorPapel: 'RENTER' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(repository.countActiveLeads).not.toHaveBeenCalled()
  })
})
