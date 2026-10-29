import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDashboardOverview } from '../../hooks/use-dashboard-overview'
import { dashboardService } from '../../services/dashboard-service'
import { apiDashboardOverview } from '../fixtures/dashboard'
import { DashboardTestProviders } from '../fixtures/render'

const { session } = vi.hoisted(() => ({
  session: { current: { tenantId: 'tenant-1', user: { id: 'user-1' } } as object | null },
}))

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: session.current }) }))
vi.mock('../../services/dashboard-service', () => ({
  dashboardService: { getOverview: vi.fn() },
}))

describe('useDashboardOverview', () => {
  beforeEach(() => {
    session.current = { tenantId: 'tenant-1', user: { id: 'user-1' } }
    vi.mocked(dashboardService.getOverview).mockReset().mockResolvedValue(apiDashboardOverview)
  })

  it('devolve o resumo já convertido para a tela', async () => {
    const { result } = renderHook(() => useDashboardOverview(), { wrapper: DashboardTestProviders })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.recentLeads[0]).toMatchObject({
      name: 'Carlos Lima',
      status: 'new',
    })
    expect(result.current.data?.upcomingActivities[0].property?.title).toBe('Apartamento Batel')
  })

  it('não busca sem sessão', () => {
    session.current = null
    renderHook(() => useDashboardOverview(), { wrapper: DashboardTestProviders })

    expect(dashboardService.getOverview).not.toHaveBeenCalled()
  })
})
