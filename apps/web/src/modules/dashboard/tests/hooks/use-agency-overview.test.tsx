import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAgencyOverview } from '../../hooks/use-agency-overview'
import { dashboardService } from '../../services/dashboard-service'
import { apiAgencyOverview } from '../fixtures/dashboard'
import { DashboardTestProviders } from '../fixtures/render'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { tenantId: 'tenant-1', user: { id: 'owner-1' } } }),
}))
vi.mock('../../services/dashboard-service', () => ({
  dashboardService: { getAgencyOverview: vi.fn() },
}))

describe('useAgencyOverview', () => {
  beforeEach(() => {
    vi.mocked(dashboardService.getAgencyOverview).mockReset().mockResolvedValue(apiAgencyOverview)
  })

  it('não pede os dados da imobiliária quando desabilitado', () => {
    const { result } = renderHook(() => useAgencyOverview(false), {
      wrapper: DashboardTestProviders,
    })

    expect(dashboardService.getAgencyOverview).not.toHaveBeenCalled()
    expect(result.current.overview).toBeNull()
  })

  it('converte o resumo da imobiliária e fica em BRL no pt-BR', async () => {
    const { result } = renderHook(() => useAgencyOverview(true), {
      wrapper: DashboardTestProviders,
    })

    await waitFor(() => expect(result.current.overview).not.toBeNull())
    expect(result.current.overview?.kpis[0]).toMatchObject({ id: 'portfolio', value: '42' })
    expect(result.current.overview?.activities[0]).toMatchObject({ broker: 'Bruna', tone: 'lead' })
    expect(result.current.targetCurrency).toBe('BRL')
    expect(result.current.displayCurrency).toBe('BRL')
  })
})
