import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useDashboardAgendaNotifications } from '@shared/hooks/use-dashboard-agenda-notifications'
import { dashboardAgendaService } from '@shared/services/dashboard-agenda-service'
import { AgendaQueryTestProvider } from '../fixtures/agenda-query-provider'
import type { AgendaEventApi } from '../../types/agenda-event'

const { session } = vi.hoisted(() => ({
  session: { tenantId: 'tenant', user: { id: 'u1' }, role: 'OWNER' },
}))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: session }) }))
vi.mock('@shared/services/dashboard-agenda-service', () => ({
  dashboardAgendaService: { list: vi.fn() },
}))
beforeEach(() => {
  vi.resetAllMocks()
  session.user.id = 'u1'
  session.role = 'OWNER'
})
it('isola o sino entre usuários e papéis e usa o rótulo autorizado do imóvel', async () => {
  const event = {
    id: 'private',
    title: 'Visita',
    kind: 'VISIT',
    status: 'CONFIRMED',
    start: new Date().toISOString(),
    propertyReference: null,
    propertyLabel: 'Apartamento autorizado',
    participantName: 'Cliente',
  } as AgendaEventApi
  vi.mocked(dashboardAgendaService.list).mockResolvedValueOnce([event]).mockResolvedValue([])
  const { result, rerender } = renderHook(() => useDashboardAgendaNotifications(), {
    wrapper: AgendaQueryTestProvider,
  })
  await waitFor(() => expect(result.current).toHaveLength(1))
  expect(result.current[0].message).toContain('Apartamento autorizado')
  session.user.id = 'u2'
  rerender()
  expect(result.current).toEqual([])
  await waitFor(() => expect(dashboardAgendaService.list).toHaveBeenCalledTimes(2))
  session.role = 'AGENT'
  rerender()
  expect(result.current).toEqual([])
  await waitFor(() => expect(dashboardAgendaService.list).toHaveBeenCalledTimes(3))
})
it('não consulta notificações sem usuário resolvido ou para locatários', () => {
  session.user.id = ''
  const { rerender } = renderHook(() => useDashboardAgendaNotifications(), {
    wrapper: AgendaQueryTestProvider,
  })
  session.user.id = 'u1'
  session.role = 'RENTER'
  rerender()
  expect(dashboardAgendaService.list).not.toHaveBeenCalled()
})
