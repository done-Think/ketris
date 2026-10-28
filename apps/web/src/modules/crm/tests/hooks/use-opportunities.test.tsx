const identity = vi.hoisted(() => ({ tenantId: 'tenant-1' as string | undefined }))
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    status: 'authenticated',
    data: { tenantId: identity.tenantId, user: { id: 'user-1' }, role: 'OWNER' },
  }),
}))
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  crmQueryKeys,
  useCrmProperties,
  useOpportunities,
  useUpdateOpportunity,
} from '../../hooks/use-opportunities'
import { crmService } from '../../services/crm-service'
import type { Opportunity } from '../../types/opportunity'

vi.mock('../../services/crm-service', () => ({
  crmService: {
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    listProperties: vi.fn(),
    getProperty: vi.fn(),
  },
}))

const opportunity: Opportunity = {
  id: 'opportunity-1',
  tenantId: 'tenant-1',
  contactId: null,
  propertyId: 'property-1',
  responsibleId: 'agent-1',
  responsibleName: 'Ana Corretora',
  leadName: 'Maria Silva',
  leadEmail: 'maria@example.com',
  leadPhone: null,
  proposedValue: 4800,
  contractTermMonths: null,
  desiredStartDate: null,
  guaranteeType: 'NONE',
  specialConditions: [],
  notes: null,
  status: 'SENT',
  archivedAt: null,
  createdAt: '2026-08-12T10:00:00.000Z',
  updatedAt: '2026-08-12T10:00:00.000Z',
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('CRM query keys and hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    identity.tenantId = 'tenant-1'
  })

  it('scopes list keys by tenant and normalized filters', () => {
    expect(crmQueryKeys.list('tenant-1', { status: 'SENT' })).toEqual([
      'crm',
      'opportunities',
      'tenant-1',
      'list',
      [],
      { status: 'SENT', includeArchived: false },
    ])
    expect(crmQueryKeys.list('tenant-2', { includeArchived: true })).not.toEqual(
      crmQueryKeys.list('tenant-1', { includeArchived: true }),
    )
  })

  it('loads a filtered tenant opportunity list', async () => {
    vi.mocked(crmService.list).mockResolvedValueOnce({
      opportunities: [opportunity],
      pagination: { page: 1, pageSize: 5, pageCount: 1, totalCount: 1 },
      groups: [],
    })
    const queryClient = createQueryClient()
    const filters = { status: 'SENT' as const }
    const { result } = renderHook(() => useOpportunities(filters), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(crmService.list).toHaveBeenCalledWith(filters)
    expect(
      queryClient.getQueryData(crmQueryKeys.list('tenant-1', filters, ['user-1', 'OWNER'])),
    ).toMatchObject({ opportunities: [opportunity] })
  })

  it('scopes public property queries by the active CRM tenant', async () => {
    vi.mocked(crmService.listProperties).mockResolvedValueOnce({
      properties: [],
      pagination: { page: 1, pageSize: 10, pageCount: 1, totalCount: 0 },
    })
    const queryClient = createQueryClient()
    const filters = { q: 'Jardins' }
    const { result } = renderHook(() => useCrmProperties(filters), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(crmService.listProperties).toHaveBeenCalledWith({ ...filters, page: 1, pageSize: 10 })
    expect(crmQueryKeys.propertyList('tenant-1', filters)).not.toEqual(
      crmQueryKeys.propertyList('tenant-2', filters),
    )
  })

  it('does not request opportunities without a tenant', () => {
    identity.tenantId = undefined
    const queryClient = createQueryClient()
    const { result } = renderHook(() => useOpportunities(), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(crmService.list).not.toHaveBeenCalled()
  })

  it('updates the detail cache and invalidates tenant lists after an update', async () => {
    const updated = { ...opportunity, status: 'IN_NEGOTIATION' as const }
    vi.mocked(crmService.update).mockResolvedValueOnce(updated)
    const queryClient = createQueryClient()
    const listKey = crmQueryKeys.list('tenant-1')
    queryClient.setQueryData(listKey, [opportunity])
    const { result } = renderHook(() => useUpdateOpportunity(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        id: opportunity.id,
        changes: { status: 'IN_NEGOTIATION' },
      })
    })

    expect(
      queryClient.getQueryData(
        crmQueryKeys.detail('tenant-1', opportunity.id, ['user-1', 'OWNER']),
      ),
    ).toEqual(updated)
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })
})
