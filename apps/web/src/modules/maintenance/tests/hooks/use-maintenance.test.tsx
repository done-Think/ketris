import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  maintenanceQueryKeys,
  useAddMaintenanceTicketNote,
  useCreateMaintenanceTicket,
  useDeleteMaintenanceTicket,
  useLinkMaintenanceUsers,
  useMaintenanceAction,
  useMaintenanceTicket,
  useMaintenanceTickets,
  useResolveMaintenanceTicket,
  useUpdateMaintenanceTicket,
  useUploadMaintenanceTicketAttachment,
} from '../../hooks/use-maintenance'
import { maintenanceService } from '../../services/maintenance-service'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { tenantId: 't1', user: { id: 'u1' }, role: 'OWNER' } }),
}))
vi.mock('../../services/maintenance-service', () => ({
  maintenanceService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    resolve: vi.fn(),
    addNote: vi.fn(),
    uploadAttachment: vi.fn(),
    act: vi.fn(),
    linkUsers: vi.fn(),
  },
}))

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

describe('maintenanceQueryKeys', () => {
  it('gives each category filter its own cached list', () => {
    expect(maintenanceQueryKeys.list('t1', { category: 'PLUMBING' })).not.toEqual(
      maintenanceQueryKeys.list('t1', { category: 'ELECTRICAL' }),
    )
    expect(maintenanceQueryKeys.list('t1', {})).toEqual(maintenanceQueryKeys.list('t1', {}))
  })
})

describe('maintenance queries', () => {
  it('loads the list and the detail only when tenant and ticket are known', async () => {
    vi.mocked(maintenanceService.list).mockResolvedValue({ items: [], totalCount: 0 })
    vi.mocked(maintenanceService.get).mockResolvedValue({ id: 'ticket-1' } as never)

    const list = renderHook(() => useMaintenanceTickets('t1', { category: 'OTHER' }), { wrapper })
    const detail = renderHook(() => useMaintenanceTicket('t1', 'ticket-1'), { wrapper })
    renderHook(() => useMaintenanceTicket('t1', null), { wrapper })

    await waitFor(() => expect(list.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(detail.result.current.data).toEqual({ id: 'ticket-1' }))
    expect(maintenanceService.list).toHaveBeenCalledWith({ category: 'OTHER' })
    expect(maintenanceService.get).toHaveBeenCalledTimes(1)
  })
})

describe('maintenance mutations refresh what they change', () => {
  it.each([
    {
      name: 'create',
      run: () => renderHook(() => useCreateMaintenanceTicket('t1'), { wrapper }),
      input: {
        contractId: 'c1',
        category: 'OTHER',
        priority: 'normal' as const,
        title: 'T',
        description: 'D',
      },
      setup: () => vi.mocked(maintenanceService.create).mockResolvedValue({ id: 'n1' } as never),
      keys: [maintenanceQueryKeys.lists('t1')],
    },
    {
      name: 'update',
      run: () => renderHook(() => useUpdateMaintenanceTicket('t1'), { wrapper }),
      input: { id: 'ticket-1', payload: { title: 'Novo' } },
      setup: () =>
        vi.mocked(maintenanceService.update).mockResolvedValue({ id: 'ticket-1' } as never),
      keys: [maintenanceQueryKeys.detail('t1', 'ticket-1'), maintenanceQueryKeys.lists('t1')],
    },
    {
      name: 'resolve',
      run: () => renderHook(() => useResolveMaintenanceTicket('t1', 'ticket-1'), { wrapper }),
      input: undefined,
      setup: () =>
        vi.mocked(maintenanceService.resolve).mockResolvedValue({ id: 'ticket-1' } as never),
      keys: [maintenanceQueryKeys.detail('t1', 'ticket-1'), maintenanceQueryKeys.lists('t1')],
    },
    {
      name: 'note',
      run: () => renderHook(() => useAddMaintenanceTicketNote('t1', 'ticket-1'), { wrapper }),
      input: 'Olá',
      setup: () => vi.mocked(maintenanceService.addNote).mockResolvedValue({ id: 'a1' } as never),
      keys: [maintenanceQueryKeys.detail('t1', 'ticket-1')],
    },
    {
      name: 'attachment',
      run: () =>
        renderHook(() => useUploadMaintenanceTicketAttachment('t1', 'ticket-1'), { wrapper }),
      input: new File(['x'], 'foto.png'),
      setup: () =>
        vi.mocked(maintenanceService.uploadAttachment).mockResolvedValue({ id: 'f1' } as never),
      keys: [maintenanceQueryKeys.detail('t1', 'ticket-1')],
    },
    {
      name: 'action',
      run: () => renderHook(() => useMaintenanceAction('t1', 'ticket-1'), { wrapper }),
      input: { action: 'start' as const },
      setup: () => vi.mocked(maintenanceService.act).mockResolvedValue({ id: 'ticket-1' } as never),
      keys: [maintenanceQueryKeys.tenant('t1')],
    },
    {
      name: 'links',
      run: () => renderHook(() => useLinkMaintenanceUsers(), { wrapper }),
      input: { contractId: 'c1', ownerId: 'o1' },
      setup: () => vi.mocked(maintenanceService.linkUsers).mockResolvedValue(undefined),
      keys: [['maintenance-options'], maintenanceQueryKeys.all],
    },
  ])('$name', async ({ run, input, setup, keys }) => {
    setup()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = run()

    await act(() => (result.current.mutateAsync as (value: unknown) => Promise<unknown>)(input))

    for (const queryKey of keys) expect(invalidate).toHaveBeenCalledWith({ queryKey })
  })

  it('delete drops the cached detail and refreshes the lists', async () => {
    vi.mocked(maintenanceService.remove).mockResolvedValue(undefined)
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const remove = vi.spyOn(client, 'removeQueries')
    const { result } = renderHook(() => useDeleteMaintenanceTicket('t1'), { wrapper })

    await act(() => result.current.mutateAsync('ticket-1'))

    expect(invalidate).toHaveBeenCalledWith({ queryKey: maintenanceQueryKeys.lists('t1') })
    expect(remove).toHaveBeenCalledWith({ queryKey: maintenanceQueryKeys.detail('t1', 'ticket-1') })
  })
})
