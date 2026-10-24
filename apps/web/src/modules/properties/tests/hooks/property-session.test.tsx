import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'

import {
  useProperties,
  useProperty,
  usePropertyPage,
  useCreateProperty,
  useUpdateProperty,
  usePublishProperty,
  useUnpublishProperty,
  useDeleteProperty,
} from '../../hooks/use-properties'
import { propertiesService } from '../../services/properties-service'
import type { Property } from '../../types/property'
import { useDashboardPropertyMappingOptions } from '../../hooks/use-dashboard-property-mapping-options'

const { session } = vi.hoisted(() => ({
  session: { tenantId: 'tenant-1', role: 'AGENT', user: { id: 'agent-1' } },
}))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: session }) }))
vi.mock('../../services/properties-service', () => ({
  propertiesService: {
    list: vi.fn(),
    listPage: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    remove: vi.fn(),
  },
}))

beforeEach(() => {
  vi.resetAllMocks()
  session.tenantId = 'tenant-1'
  session.role = 'AGENT'
  session.user.id = 'agent-1'
})

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

it('does not reuse another users list or detail cache in the same tenant', async () => {
  const property = { id: 'property-1', title: 'Agent property' } as Property
  vi.mocked(propertiesService.list).mockResolvedValueOnce([property]).mockResolvedValueOnce([])
  vi.mocked(propertiesService.getById)
    .mockResolvedValueOnce(property)
    .mockRejectedValueOnce(new Error('not found'))
  const { result, rerender } = renderHook(
    () => ({ list: useProperties(), detail: useProperty(property.id) }),
    { wrapper: wrapper() },
  )
  await waitFor(() => expect(result.current.list.data).toEqual([property]))
  await waitFor(() => expect(result.current.detail.data).toEqual(property))
  session.user.id = 'renter-1'
  session.role = 'RENTER'
  rerender()
  expect(result.current.list.data).toBeUndefined()
  expect(result.current.detail.data).toBeUndefined()
  await waitFor(() => expect(result.current.list.data).toEqual([]))
  await waitFor(() => expect(result.current.detail.isError).toBe(true))
  expect(propertiesService.list).toHaveBeenCalledTimes(2)
  expect(propertiesService.getById).toHaveBeenCalledTimes(2)
})

it('does not request tenant properties before session tenant resolution', () => {
  session.tenantId = ''
  renderHook(() => ({ list: useProperties(), detail: useProperty('property-1') }), {
    wrapper: wrapper(),
  })
  expect(propertiesService.list).not.toHaveBeenCalled()
  expect(propertiesService.getById).not.toHaveBeenCalled()
})

it('preserves interpolation templates for property mapping instead of formatting without values', () => {
  const { result } = renderHook(() => useDashboardPropertyMappingOptions())
  expect(result.current.messages.activity.priceAdjustment).toContain('{price}')
  expect(result.current.messages.activity.visitScheduled).toContain('{name}')
  expect(result.current.messages.pricingDetails.installmentsDeposit).toContain('{count}')
})

it('does not keep the previous page when the authenticated user changes', async () => {
  const page = {
    properties: [{ id: 'private-property' } as Property],
    pagination: { page: 1, pageSize: 5, total: 1, totalPages: 1 },
    counts: { DRAFT: 1, PUBLISHED: 0, RENTED: 0, SOLD: 0, INACTIVE: 0 },
  }
  vi.mocked(propertiesService.listPage)
    .mockResolvedValueOnce(page)
    .mockImplementationOnce(() => new Promise(() => {}))
  const { result, rerender } = renderHook(() => usePropertyPage({ page: 1, pageSize: 5 }), {
    wrapper: wrapper(),
  })
  await waitFor(() => expect(result.current.data).toEqual(page))
  session.user.id = 'other-user'
  rerender()
  expect(result.current.data).toBeUndefined()
})

it.each([
  ['create', useCreateProperty],
  ['update', () => useUpdateProperty('property-1')],
  ['publish', usePublishProperty],
  ['unpublish', useUnpublishProperty],
  ['remove', useDeleteProperty],
] as const)(
  'invalidates the actual caches of property consumers after %s',
  async (method, usePropertyMutation) => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
    const keys = [
      ['properties', 'page', 'tenant-1'],
      ['agenda', 'events', 'tenant-1'],
      ['contracts', 'list', 'tenant-1'],
      ['marketplace', 'properties', 'search'],
    ]
    for (const key of keys) client.setQueryData(key, [])
    vi.mocked(propertiesService[method]).mockResolvedValue(undefined as never)
    const { result } = renderHook(() => usePropertyMutation(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    })
    await act(async () => {
      await result.current.mutateAsync('property-1' as never)
    })
    for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true)
  },
)
