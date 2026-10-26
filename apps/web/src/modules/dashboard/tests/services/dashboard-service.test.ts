import { describe, expect, it, vi } from 'vitest'

import { DashboardService } from '../../services/dashboard-service'
import { apiAgencyOverview, apiDashboardOverview } from '../fixtures/dashboard'

describe('DashboardService', () => {
  it('busca os dois resumos pelos endpoints agregados', async () => {
    const http = { get: vi.fn() }
    http.get.mockResolvedValueOnce(apiDashboardOverview).mockResolvedValueOnce(apiAgencyOverview)
    const service = new DashboardService(http as never)

    await expect(service.getOverview()).resolves.toBe(apiDashboardOverview)
    await expect(service.getAgencyOverview()).resolves.toBe(apiAgencyOverview)
    expect(http.get).toHaveBeenNthCalledWith(1, '/dashboard/overview')
    expect(http.get).toHaveBeenNthCalledWith(2, '/agency-dashboard/overview')
  })
})
