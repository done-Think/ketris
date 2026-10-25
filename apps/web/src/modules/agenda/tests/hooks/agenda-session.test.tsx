import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'

import { useAgendaEvents } from '../../hooks/use-agenda-events'
import { useAgendaOrganization } from '../../hooks/use-agenda-organization'
import { useAgendaAgents } from '../../hooks/use-agenda-agents'
import { agendaService } from '../../services/agenda-service'
import type { RenterAgendaEventApi } from '../../types/agenda-event'

const { session } = vi.hoisted(() => ({
  session: { tenantId: 'renters', role: 'RENTER', user: { id: 'renter-1' } },
}))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: session }) }))
vi.mock('../../services/agenda-service', () => ({
  agendaService: {
    list: vi.fn(),
    listCharges: vi.fn(),
    listMaintenance: vi.fn(),
    listAgents: vi.fn(),
  },
}))

beforeEach(() => {
  vi.resetAllMocks()
  session.tenantId = 'renters'
  session.role = 'RENTER'
  session.user.id = 'renter-1'
})

it.each(['RENTER', 'AGENT', 'PROPERTY_OWNER'])(
  'does not request the agency user list for %s',
  (role) => {
    session.role = role
    renderHook(() => useAgendaAgents(true), { wrapper: wrapper() })
    expect(agendaService.listAgents).not.toHaveBeenCalled()
  },
)

it('loads agent options only for the agency owner with an open form', async () => {
  session.role = 'OWNER'
  vi.mocked(agendaService.listAgents).mockResolvedValue([{ id: 'agent', name: 'Ana' }])
  const { result, rerender } = renderHook(({ open }) => useAgendaAgents(open), {
    initialProps: { open: false },
    wrapper: wrapper(),
  })
  expect(agendaService.listAgents).not.toHaveBeenCalled()
  rerender({ open: true })
  await waitFor(() => expect(result.current.data).toEqual([{ id: 'agent', name: 'Ana' }]))
})

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

it('does not reuse agenda data between renters sharing a tenant or between roles', async () => {
  const event: RenterAgendaEventApi = {
    id: 'event-1',
    title: 'Inspection',
    kind: 'INSPECTION',
    status: 'CONFIRMED',
    start: '2026-10-20T09:00:00Z',
    end: '2026-10-20T10:00:00Z',
    propertyId: null,
    propertyReference: 'Apartment',
    responsibleName: 'Ana',
    propertyLabel: null,
  }
  vi.mocked(agendaService.list).mockResolvedValueOnce([event]).mockResolvedValue([])
  const { result, rerender } = renderHook(
    () => useAgendaEvents(session.tenantId, '2026-10-20', '2026-10-25'),
    { wrapper: wrapper() },
  )
  await waitFor(() => expect(result.current.data).toEqual([event]))
  session.user.id = 'renter-2'
  rerender()
  expect(result.current.data).toBeUndefined()
  await waitFor(() => expect(result.current.data).toEqual([]))
  session.role = 'AGENT'
  rerender()
  expect(result.current.data).toBeUndefined()
  await waitFor(() => expect(agendaService.list).toHaveBeenCalledTimes(3))
})

it('waits for a resolved user before requesting agenda data', () => {
  session.user.id = ''
  renderHook(() => useAgendaEvents(session.tenantId, '2026-10-20', '2026-10-25'), {
    wrapper: wrapper(),
  })
  expect(agendaService.list).not.toHaveBeenCalled()
})

it('isolates charges and tickets between renters and keeps successful sources when another fails', async () => {
  vi.mocked(agendaService.listCharges)
    .mockResolvedValueOnce([])
    .mockRejectedValue(new Error('unavailable'))
  vi.mocked(agendaService.listMaintenance).mockResolvedValue([])
  const { result, rerender } = renderHook(() => useAgendaOrganization(), { wrapper: wrapper() })
  await waitFor(() => expect(result.current.charges.isSuccess).toBe(true))
  session.user.id = 'renter-2'
  rerender()
  expect(result.current.charges.data).toBeUndefined()
  expect(result.current.maintenance.data).toBeUndefined()
  await waitFor(() => expect(result.current.charges.isError).toBe(true))
  expect(result.current.maintenance.isSuccess).toBe(true)
})

it('loads maintenance for the agency owner without requesting renter charges', async () => {
  session.role = 'OWNER'
  vi.mocked(agendaService.listMaintenance).mockResolvedValue([])
  const { result } = renderHook(() => useAgendaOrganization(), { wrapper: wrapper() })
  await waitFor(() => expect(result.current.maintenance.isSuccess).toBe(true))
  expect(agendaService.listMaintenance).toHaveBeenCalledTimes(1)
  expect(agendaService.listCharges).not.toHaveBeenCalled()
})

it.each(['PROPERTY_OWNER', 'AGENT'])('does not expand organization data access for %s', (role) => {
  session.role = role
  renderHook(() => useAgendaOrganization(), { wrapper: wrapper() })
  expect(agendaService.listCharges).not.toHaveBeenCalled()
  expect(agendaService.listMaintenance).not.toHaveBeenCalled()
})

it('waits for a resolved user before loading organization data', () => {
  session.user.id = ''
  renderHook(() => useAgendaOrganization(), { wrapper: wrapper() })
  expect(agendaService.listMaintenance).not.toHaveBeenCalled()
  expect(agendaService.listCharges).not.toHaveBeenCalled()
})

it('does not reuse agency owner tickets between tenants, users or roles', async () => {
  session.role = 'OWNER'
  const tickets = [
    {
      id: 'tenant-ticket',
      title: 'Repair',
      propertyTitle: 'Apartment',
      createdAt: '2026-10-20T09:00:00Z',
      scheduledAt: '2026-10-21T14:00:00Z',
      status: 'ABERTO' as const,
    },
  ]
  vi.mocked(agendaService.listMaintenance).mockResolvedValueOnce(tickets).mockResolvedValue([])
  vi.mocked(agendaService.listCharges).mockResolvedValue([])
  const { result, rerender } = renderHook(() => useAgendaOrganization(), { wrapper: wrapper() })
  await waitFor(() => expect(result.current.maintenance.data).toEqual(tickets))

  session.tenantId = 'other-tenant'
  rerender()
  expect(result.current.maintenance.data).toBeUndefined()
  await waitFor(() => expect(result.current.maintenance.data).toEqual([]))

  session.user.id = 'other-admin'
  rerender()
  expect(result.current.maintenance.data).toBeUndefined()
  await waitFor(() => expect(result.current.maintenance.data).toEqual([]))

  session.role = 'RENTER'
  rerender()
  expect(result.current.maintenance.data).toBeUndefined()
  await waitFor(() => expect(result.current.maintenance.data).toEqual([]))
  expect(agendaService.listMaintenance).toHaveBeenCalledTimes(4)
})
