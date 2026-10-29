const identity = vi.hoisted((): { tenantId: string | undefined; userId: string } => ({
  tenantId: 'tenant-1',
  userId: 'user-1',
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    status: 'authenticated',
    data: { tenantId: identity.tenantId, user: { id: identity.userId }, role: 'OWNER' },
  }),
}))
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  crmContactQueryKeys,
  useArchiveContact,
  useContacts,
  useCreateContact,
  useUpdateContact,
} from '../../hooks/use-contacts'
import { crmService } from '../../services/crm-service'
import type { ApiContactListItem } from '../../types/contact'

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
  type: 'RENTER',
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
    identity.tenantId = 'tenant-1'
    identity.userId = 'user-1'
  })

  it('scopes list keys by tenant and normalized filters', () => {
    expect(crmContactQueryKeys.list('tenant-1', { type: 'RENTER' })).toEqual([
      'crm',
      'contacts',
      'tenant-1',
      'list',
      [],
      { type: 'RENTER', q: null, includeArchived: false },
    ])
    expect(crmContactQueryKeys.list('tenant-2', { includeArchived: true })).not.toEqual(
      crmContactQueryKeys.list('tenant-1', { includeArchived: true }),
    )
  })

  it('loads a filtered tenant contact list', async () => {
    vi.mocked(crmService.listContacts).mockResolvedValueOnce({
      contacts: [contact],
      pagination: { page: 1, pageSize: 5, pageCount: 1, totalCount: 1 },
      groups: [],
    })
    const queryClient = createQueryClient()
    const filters = { type: 'RENTER' as const }
    const { result } = renderHook(() => useContacts(filters), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(crmService.listContacts).toHaveBeenCalledWith(filters)
    expect(
      queryClient.getQueryData(crmContactQueryKeys.list('tenant-1', filters, ['user-1', 'OWNER'])),
    ).toMatchObject({ contacts: [contact] })
  })

  it('does not request contacts without a tenant', () => {
    identity.tenantId = undefined
    const queryClient = createQueryClient()
    const { result } = renderHook(() => useContacts(), {
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
    const { result } = renderHook(() => useCreateContact(), {
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
    const { result } = renderHook(() => useUpdateContact(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ id: contact.id, changes: { name: 'Maria S.' } })
    })

    expect(
      queryClient.getQueryData(
        crmContactQueryKeys.detail('tenant-1', contact.id, ['user-1', 'OWNER']),
      ),
    ).toEqual(updated)
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })

  it('archives a contact and invalidates tenant lists', async () => {
    const archived = { ...contact, archivedAt: '2026-09-01T00:00:00.000Z' }
    vi.mocked(crmService.archiveContact).mockResolvedValueOnce(archived)
    const queryClient = createQueryClient()
    const listKey = crmContactQueryKeys.list('tenant-1')
    queryClient.setQueryData(listKey, [contact])
    const { result } = renderHook(() => useArchiveContact(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(contact.id)
    })

    expect(
      queryClient.getQueryData(
        crmContactQueryKeys.detail('tenant-1', contact.id, ['user-1', 'OWNER']),
      ),
    ).toEqual(archived)
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })

  it('stores an in-flight update only under the session that initiated it', async () => {
    const updated = { ...contact, name: 'Maria S.' }
    let completeUpdate: (value: ApiContactListItem) => void = () => undefined
    vi.mocked(crmService.updateContact).mockReturnValueOnce(
      new Promise((resolve) => {
        completeUpdate = resolve
      }),
    )
    const client = createQueryClient()
    const { result, rerender } = renderHook(() => useUpdateContact(), {
      wrapper: createWrapper(client),
    })
    act(() => result.current.mutate({ id: contact.id, changes: { name: updated.name } }))
    await waitFor(() => expect(crmService.updateContact).toHaveBeenCalled())
    identity.tenantId = 'tenant-2'
    identity.userId = 'user-2'
    rerender()
    await act(async () => completeUpdate(updated))

    await waitFor(() =>
      expect(
        client.getQueryData(
          crmContactQueryKeys.detail('tenant-1', contact.id, ['user-1', 'OWNER']),
        ),
      ).toEqual(updated),
    )
    expect(
      client.getQueryData(crmContactQueryKeys.detail('tenant-2', contact.id, ['user-2', 'OWNER'])),
    ).toBeUndefined()
    client.clear()
  })
})
