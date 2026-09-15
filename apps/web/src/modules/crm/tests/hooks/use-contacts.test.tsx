import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { crmService } from '../../services/crm-service'
import type { ApiContactListItem } from '../../types/contact'
import {
  crmContactQueryKeys,
  useArchiveContact,
  useContacts,
  useCreateContact,
  useUpdateContact,
} from '../../hooks/use-contacts'

vi.mock('../../services/crm-service', () => ({
  crmService: {
    listContacts: vi.fn(),
    getContact: vi.fn(),
    createContact: vi.fn(),
    updateContact: vi.fn(),
    archiveContact: vi.fn(),
  },
}))

const contact: ApiContactListItem = {
  id: 'contact-1',
  tenantId: 'tenant-1',
  name: 'Maria Silva',
  email: 'maria@example.com',
  phone: null,
  type: 'LOCATARIO',
  avatarUrl: null,
  notes: null,
  lastInteraction: null,
  archivedAt: null,
  createdAt: '2026-08-12T10:00:00.000Z',
  updatedAt: '2026-08-12T10:00:00.000Z',
  propertyCount: 0,
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

describe('CRM contact query keys and hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('scopes list keys by tenant and normalized filters', () => {
    expect(crmContactQueryKeys.list('tenant-1', { type: 'LOCATARIO' })).toEqual([
      'crm',
      'contacts',
      'tenant-1',
      'list',
      { type: 'LOCATARIO', q: null, includeArchived: false },
    ])
    expect(crmContactQueryKeys.list('tenant-2', { includeArchived: true })).not.toEqual(
      crmContactQueryKeys.list('tenant-1', { includeArchived: true }),
    )
  })

  it('loads a filtered tenant contact list', async () => {
    vi.mocked(crmService.listContacts).mockResolvedValueOnce([contact])
    const queryClient = createQueryClient()
    const filters = { type: 'LOCATARIO' as const }
    const { result } = renderHook(() => useContacts('tenant-1', filters), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(crmService.listContacts).toHaveBeenCalledWith(filters)
    expect(queryClient.getQueryData(crmContactQueryKeys.list('tenant-1', filters))).toEqual([
      contact,
    ])
  })

  it('does not request contacts without a tenant', () => {
    const queryClient = createQueryClient()
    const { result } = renderHook(() => useContacts(null), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(crmService.listContacts).not.toHaveBeenCalled()
  })

  it('invalidates tenant lists after creating a contact', async () => {
    vi.mocked(crmService.createContact).mockResolvedValueOnce(contact)
    const queryClient = createQueryClient()
    const listKey = crmContactQueryKeys.list('tenant-1')
    queryClient.setQueryData(listKey, [])
    const { result } = renderHook(() => useCreateContact('tenant-1'), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ name: 'Maria Silva', email: 'maria@example.com' })
    })

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })

  it('updates the detail cache and invalidates tenant lists after an update', async () => {
    const updated = { ...contact, name: 'Maria S.' }
    vi.mocked(crmService.updateContact).mockResolvedValueOnce(updated)
    const queryClient = createQueryClient()
    const listKey = crmContactQueryKeys.list('tenant-1')
    queryClient.setQueryData(listKey, [contact])
    const { result } = renderHook(() => useUpdateContact('tenant-1'), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ id: contact.id, changes: { name: 'Maria S.' } })
    })

    expect(queryClient.getQueryData(crmContactQueryKeys.detail('tenant-1', contact.id))).toEqual(
      updated,
    )
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })

  it('archives a contact and invalidates tenant lists', async () => {
    const archived = { ...contact, archivedAt: '2026-09-01T00:00:00.000Z' }
    vi.mocked(crmService.archiveContact).mockResolvedValueOnce(archived)
    const queryClient = createQueryClient()
    const listKey = crmContactQueryKeys.list('tenant-1')
    queryClient.setQueryData(listKey, [contact])
    const { result } = renderHook(() => useArchiveContact('tenant-1'), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(contact.id)
    })

    expect(queryClient.getQueryData(crmContactQueryKeys.detail('tenant-1', contact.id))).toEqual(
      archived,
    )
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })
})
