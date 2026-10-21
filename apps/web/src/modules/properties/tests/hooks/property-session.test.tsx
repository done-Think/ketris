import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'

import { useProperties, useProperty } from '../../hooks/use-properties'
import { propertiesService } from '../../services/properties-service'
import type { Property } from '../../types/property'
import { useDashboardPropertyMappingOptions } from '../../hooks/use-dashboard-property-mapping-options'

const { session } = vi.hoisted(() => ({
  session: { tenantId: 'tenant-1', papel: 'AGENT', user: { id: 'agent-1' } },
}))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: session }) }))
vi.mock('../../services/properties-service', () => ({
  propertiesService: { list: vi.fn(), getById: vi.fn() },
}))

beforeEach(() => {
  vi.resetAllMocks()
  session.tenantId = 'tenant-1'
  session.papel = 'AGENT'
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
  session.papel = 'RENTER'
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
