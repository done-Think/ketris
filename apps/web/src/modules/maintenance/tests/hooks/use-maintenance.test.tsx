import type { MaintenanceCategory } from '@shared/lib/utils/maintenance-categories'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useMaintenanceAction,
  useMaintenanceTicket,
  useMaintenanceTickets,
} from '../../hooks/use-maintenance'
import { useMaintenanceProviderOptions } from '../../hooks/use-maintenance-providers'
import { maintenanceService } from '../../services/maintenance-service'
const auth = vi.hoisted(() => ({ id: 'user-1', role: 'OWNER' }))
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { tenantId: 'tenant-1', user: { id: auth.id }, role: auth.role },
    status: 'authenticated',
  }),
}))
vi.mock('../../services/maintenance-service', () => ({
  maintenanceService: { get: vi.fn(), list: vi.fn(), listProviders: vi.fn(), act: vi.fn() },
}))

describe('Maintenance query isolation and paging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.id = 'user-1'
    auth.role = 'OWNER'
  })
  function setup() {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    return { client, wrapper }
  }
  it('does not reuse ticket data across users or roles in the same tenant', async () => {
    vi.mocked(maintenanceService.get).mockResolvedValue({ id: 'ticket' } as Awaited<
      ReturnType<typeof maintenanceService.get>
    >)
    const { wrapper, client } = setup()
    const { result, rerender, unmount } = renderHook(
      () => useMaintenanceTicket('tenant-1', 'ticket'),
      { wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    auth.id = 'user-2'
    rerender()
    await waitFor(() => expect(maintenanceService.get).toHaveBeenCalledTimes(2))
    auth.role = 'AGENT'
    rerender()
    await waitFor(() => expect(maintenanceService.get).toHaveBeenCalledTimes(3))
    unmount()
    client.clear()
  })
  it('refreshes the provider catalog after registering a provider through a ticket action', async () => {
    const { wrapper, client } = setup()
    client.setQueryData(['maintenance-providers', 'tenant-1'], { items: [] })
    vi.mocked(maintenanceService.act).mockResolvedValue({ id: 'ticket' } as Awaited<
      ReturnType<typeof maintenanceService.act>
    >)
    const { result, unmount } = renderHook(() => useMaintenanceAction('tenant-1', 'ticket'), {
      wrapper,
    })
    await result.current.mutateAsync({ action: 'provider', provider: { name: 'New provider' } })
    expect(client.getQueryState(['maintenance-providers', 'tenant-1'])?.isInvalidated).toBe(true)
    unmount()
    client.clear()
  })
  it('keeps a separate list cache for each category and restores the previous selection', async () => {
    const plumbing: Awaited<ReturnType<typeof maintenanceService.list>> = {
      items: [
        {
          id: 'plumbing',
          propertyId: 'property',
          propertyTitle: 'Property',
          category: 'PLUMBING',
          priority: 'NORMAL',
          status: 'ABERTO',
          title: 'Leak',
          openedByName: 'Renter',
          resolvedAt: null,
          createdAt: '2026-01-01T12:00:00Z',
          updatedAt: '2026-01-01T12:00:00Z',
        },
      ],
      totalCount: 1,
      pagination: { page: 1, pageSize: 5, pageCount: 1, totalCount: 1 },
      summary: {
        totalCount: 1,
        urgentCount: 0,
        byStatus: { ABERTO: 1 },
        averageResolutionDays: null,
      },
    }
    vi.mocked(maintenanceService.list)
      .mockResolvedValueOnce(plumbing)
      .mockResolvedValueOnce({ ...plumbing, items: [], totalCount: 0 })
    const { wrapper, client } = setup()
    const { result, rerender, unmount } = renderHook(
      ({ category }) => useMaintenanceTickets('tenant-1', { category }),
      { wrapper, initialProps: { category: 'PLUMBING' as MaintenanceCategory } },
    )
    await waitFor(() => expect(result.current.data).toEqual(plumbing))
    rerender({ category: 'ELECTRICAL' })
    await waitFor(() => expect(result.current.data?.items).toEqual([]))
    expect(maintenanceService.list).toHaveBeenLastCalledWith({ category: 'ELECTRICAL' })
    rerender({ category: 'PLUMBING' })
    await waitFor(() => expect(result.current.data).toEqual(plumbing))
    expect(maintenanceService.list).toHaveBeenCalledTimes(2)
    unmount()
    client.clear()
  })
  it('loads the next catalog page and separates searches in the cache', async () => {
    vi.mocked(maintenanceService.listProviders)
      .mockResolvedValueOnce({ items: [], page: 1, pageSize: 5, totalCount: 6 })
      .mockResolvedValueOnce({ items: [], page: 2, pageSize: 5, totalCount: 6 })
      .mockResolvedValueOnce({ items: [], page: 1, pageSize: 5, totalCount: 0 })
    const { wrapper, client } = setup()
    const { result, rerender, unmount } = renderHook(
      ({ search }) => useMaintenanceProviderOptions('ticket', search),
      { wrapper, initialProps: { search: '' } },
    )
    await waitFor(() => expect(result.current.hasNextPage).toBe(true))
    await result.current.fetchNextPage()
    await waitFor(() => expect(result.current.hasNextPage).toBe(false))
    expect(maintenanceService.listProviders).toHaveBeenNthCalledWith(2, {
      ticketId: 'ticket',
      page: 2,
      pageSize: 5,
      search: undefined,
    })
    rerender({ search: 'eletricista' })
    await waitFor(() => expect(maintenanceService.listProviders).toHaveBeenCalledTimes(3))
    expect(maintenanceService.listProviders).toHaveBeenLastCalledWith({
      ticketId: 'ticket',
      page: 1,
      pageSize: 5,
      search: 'eletricista',
    })
    unmount()
    client.clear()
  })
})
