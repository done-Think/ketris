import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOpportunities } from '../../hooks/use-opportunities'
import { crmService } from '../../services/crm-service'

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))
vi.mock('../../services/crm-service', () => ({ crmService: { list: vi.fn() } }))
const page = {
  opportunities: [],
  pagination: { page: 1, pageSize: 5, pageCount: 1, totalCount: 0 },
  groups: [],
}
function session(id: string, role = 'OWNER', tenantId = 'tenant-1') {
  vi.mocked(useSession).mockReturnValue({
    status: 'authenticated',
    data: { tenantId, user: { id }, role },
  } as unknown as ReturnType<typeof useSession>)
}
describe('CRM session cache isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session('user-1')
    vi.mocked(crmService.list).mockResolvedValue(page)
  })
  it('fetches a different cache entry for a different user or role in the same tenant', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result, rerender } = renderHook(() => useOpportunities('tenant-1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(crmService.list).toHaveBeenCalledTimes(1)
    session('user-2')
    rerender()
    await waitFor(() => expect(crmService.list).toHaveBeenCalledTimes(2))
    session('user-2', 'AGENT')
    rerender()
    await waitFor(() => expect(crmService.list).toHaveBeenCalledTimes(3))
    expect(client.getQueryCache().getAll()).toHaveLength(3)
    client.clear()
  })
  it('does not fetch for a stale tenant scope after account switching', () => {
    session('user-2', 'OWNER', 'tenant-2')
    const client = new QueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useOpportunities('tenant-1'), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    expect(crmService.list).not.toHaveBeenCalled()
    client.clear()
  })
})
