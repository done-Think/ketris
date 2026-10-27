import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePlatformAdmins } from '../../hooks/use-platform-admins'
import { usePlatformOverview } from '../../hooks/use-platform-overview'
import { useSystemHealth } from '../../hooks/use-platform-overview'
import { useTenant, useTenantsPage, useTenantUsers } from '../../hooks/use-tenants'
import { platformAdminService } from '../../services/platform-admin-service'
import { platformOverviewService } from '../../services/platform-overview-service'
import { platformSystemService } from '../../services/platform-system-service'
import { tenantService } from '../../services/tenant-service'

const { useSession } = vi.hoisted(() => ({ useSession: vi.fn() }))
vi.mock('next-auth/react', () => ({ useSession }))
vi.mock('../../services/tenant-service', () => ({
  tenantService: { list: vi.fn(), get: vi.fn(), listUsers: vi.fn() },
}))
vi.mock('../../services/platform-admin-service', () => ({
  platformAdminService: { list: vi.fn() },
}))
vi.mock('../../services/platform-overview-service', () => ({
  platformOverviewService: { get: vi.fn() },
}))
vi.mock('../../services/platform-system-service', () => ({
  platformSystemService: { getHealth: vi.fn() },
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const query = { page: 1, pageSize: 20 }

describe('platform queries wait for the session token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tenantService.list).mockResolvedValue({
      tenants: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      statusCounts: { TRIAL: 0, ACTIVE: 0, SUSPENDED: 0, CANCELED: 0 },
    })
    vi.mocked(platformAdminService.list).mockResolvedValue([])
    vi.mocked(platformOverviewService.get).mockResolvedValue({
      metrics: { tenantsCount: 0, brokersCount: 0, propertiesCount: 0, mrr: 0, churnRate: null },
      growthTrend: [],
      recentTenants: [],
    })
  })

  it('does not request anything while the session is still loading', () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: 'loading', update: vi.fn() })

    const tenants = renderHook(() => useTenantsPage(query), { wrapper: createWrapper() })
    const overview = renderHook(() => usePlatformOverview(), { wrapper: createWrapper() })
    const health = renderHook(() => useSystemHealth(), { wrapper: createWrapper() })
    const admins = renderHook(() => usePlatformAdmins(), { wrapper: createWrapper() })

    expect(tenants.result.current.isPending).toBe(true)
    expect(admins.result.current.isPending).toBe(true)
    expect(overview.result.current.isPending).toBe(true)
    expect(health.result.current.isPending).toBe(true)
    renderHook(() => useTenantUsers('tenant-1', 1, 20), { wrapper: createWrapper() })
    renderHook(() => useTenant('tenant-1'), { wrapper: createWrapper() })
    expect(tenantService.list).not.toHaveBeenCalled()
    expect(tenantService.get).not.toHaveBeenCalled()
    expect(tenantService.listUsers).not.toHaveBeenCalled()
    expect(platformOverviewService.get).not.toHaveBeenCalled()
    expect(platformSystemService.getHealth).not.toHaveBeenCalled()
    expect(platformAdminService.list).not.toHaveBeenCalled()
  })

  it('requests tenants and the overview once the session has an access token', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        accessToken: 'token',
        refreshToken: 'refresh',
        scope: 'platform',
        platformRole: 'AGENT',
        user: { id: 'admin-1' },
        expires: '2099-01-01T00:00:00Z',
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    const tenants = renderHook(() => useTenantsPage(query), { wrapper: createWrapper() })
    const overview = renderHook(() => usePlatformOverview(), { wrapper: createWrapper() })

    await waitFor(() => expect(tenants.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(overview.result.current.isSuccess).toBe(true))
    expect(tenantService.list).toHaveBeenCalledWith(query)
    expect(platformOverviewService.get).toHaveBeenCalledTimes(1)

    vi.mocked(platformSystemService.getHealth).mockResolvedValue({
      checkedAt: '2026-10-15T12:00:00.000Z',
      database: { status: 'up', latencyMs: 5 },
      serverUptimeSeconds: 10,
      errorTracking: { configured: false },
    })
    const health = renderHook(() => useSystemHealth(), { wrapper: createWrapper() })
    await waitFor(() => expect(health.result.current.isSuccess).toBe(true))

    const admins = renderHook(() => usePlatformAdmins(), { wrapper: createWrapper() })
    await waitFor(() => expect(admins.result.current.isSuccess).toBe(true))
    expect(platformAdminService.list).toHaveBeenCalledTimes(1)
  })
})

describe('platform queries are scoped by admin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not reuse cached data when a tenant session is active in the same browser', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { accessToken: 'token', scope: 'tenant', user: { id: 'user-1' } },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    renderHook(() => useTenantsPage(query), { wrapper: createWrapper() })

    expect(tenantService.list).not.toHaveBeenCalled()
  })
})
