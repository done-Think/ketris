import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'

import { useCharge, useCharges, useFinancialSummary } from '../hooks/use-financial'
import { financialService } from '../services/financial-service'
import { useDashboardAgendaNotifications } from '@shared/hooks/use-dashboard-agenda-notifications'
import { httpClient } from '@shared/lib/api/http-client'

const { session } = vi.hoisted(() => ({
  session: { user: { id: 'owner' }, tenantId: 'tenant', role: 'OWNER' },
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: session, status: 'authenticated' }),
}))
vi.mock('../services/financial-service', () => ({
  financialService: { listCharges: vi.fn(), getCharge: vi.fn(), getSummary: vi.fn() },
}))
vi.mock('@shared/lib/api/http-client', () => ({ httpClient: { get: vi.fn() } }))

beforeEach(() => {
  vi.resetAllMocks()
  session.user.id = 'owner'
  session.role = 'OWNER'
})

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

it('does not reuse another users financial list or detail cache in the same tenant', async () => {
  vi.mocked(financialService.listCharges)
    .mockResolvedValueOnce({ items: [], totalCount: 20 })
    .mockResolvedValueOnce({ items: [], totalCount: 1 })
  vi.mocked(financialService.getCharge)
    .mockResolvedValueOnce({ id: 'charge', description: 'Owner view' } as Awaited<
      ReturnType<typeof financialService.getCharge>
    >)
    .mockRejectedValueOnce(new Error('not found'))
  const { result, rerender } = renderHook(
    () => ({ list: useCharges('tenant'), detail: useCharge('tenant', 'charge') }),
    { wrapper: wrapper() },
  )
  await waitFor(() => expect(result.current.list.data?.totalCount).toBe(20))
  await waitFor(() => expect(result.current.detail.data?.description).toBe('Owner view'))
  session.user.id = 'renter'
  session.role = 'RENTER'
  rerender()
  expect(result.current.list.data?.totalCount).not.toBe(20)
  expect(result.current.detail.data).toBeUndefined()
  await waitFor(() => expect(result.current.list.data?.totalCount).toBe(1))
  await waitFor(() => expect(result.current.detail.isError).toBe(true))
  expect(financialService.listCharges).toHaveBeenCalledTimes(2)
  expect(financialService.getCharge).toHaveBeenCalledTimes(2)
})

it('does not fetch agenda notifications or reuse cached tenant events for RENTER', async () => {
  vi.mocked(httpClient.get).mockResolvedValue({ events: [] })
  const { rerender, result } = renderHook(() => useDashboardAgendaNotifications(), {
    wrapper: wrapper(),
  })
  await waitFor(() => expect(httpClient.get).toHaveBeenCalledTimes(1))
  session.user.id = 'renter'
  session.role = 'RENTER'
  rerender()
  expect(result.current).toEqual([])
  expect(httpClient.get).toHaveBeenCalledTimes(1)
})

it.each(['RENTER', 'AGENT'])(
  'does not expose a cached owner summary after changing the same user to %s',
  async (role) => {
    vi.mocked(financialService.getSummary).mockResolvedValue({ monthlyReceivable: 5000 } as Awaited<
      ReturnType<typeof financialService.getSummary>
    >)
    const { result, rerender } = renderHook(() => useFinancialSummary('tenant'), {
      wrapper: wrapper(),
    })
    await waitFor(() => expect(result.current.data?.monthlyReceivable).toBe(5000))
    session.role = role
    rerender()
    expect(result.current.data).toBeUndefined()
    expect(financialService.getSummary).toHaveBeenCalledTimes(1)
  },
)
