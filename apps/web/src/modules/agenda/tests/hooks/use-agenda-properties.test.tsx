import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useAgendaProperties } from '../../hooks/use-agenda-properties'
import { agendaService } from '../../services/agenda-service'
import { AgendaQueryTestProvider } from '../fixtures/agenda-query-provider'

const { session } = vi.hoisted(() => ({
  session: { tenantId: 'tenant', user: { id: 'u1' }, role: 'OWNER' },
}))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: session }) }))
vi.mock('../../services/agenda-service', () => ({ agendaService: { listProperties: vi.fn() } }))
beforeEach(() => {
  vi.resetAllMocks()
  session.tenantId = 'tenant'
  session.user.id = 'u1'
  session.role = 'OWNER'
})
it('busca por página e carrega a próxima sem perder a primeira', async () => {
  vi.mocked(agendaService.listProperties)
    .mockResolvedValueOnce({
      items: [{ id: 'p1', label: 'Primeiro' }],
      page: 1,
      pageSize: 1,
      total: 2,
    })
    .mockResolvedValueOnce({
      items: [{ id: 'p2', label: 'Segundo' }],
      page: 2,
      pageSize: 1,
      total: 2,
    })
  const { result } = renderHook(() => useAgendaProperties('Jardins'), {
    wrapper: AgendaQueryTestProvider,
  })
  await waitFor(() => expect(result.current.hasNextPage).toBe(true))
  await act(async () => {
    await result.current.fetchNextPage()
  })
  expect(agendaService.listProperties).toHaveBeenNthCalledWith(2, 'Jardins', 2)
  await waitFor(() =>
    expect(result.current.data?.pages.flatMap((page) => page.items.map((item) => item.id))).toEqual(
      ['p1', 'p2'],
    ),
  )
  expect(result.current.hasNextPage).toBe(false)
})
it('isola resultados ao trocar usuário ou papel no mesmo tenant', async () => {
  vi.mocked(agendaService.listProperties)
    .mockResolvedValueOnce({
      items: [{ id: 'private', label: 'Restrito' }],
      page: 1,
      pageSize: 25,
      total: 1,
    })
    .mockResolvedValue({ items: [], page: 1, pageSize: 25, total: 0 })
  const { result, rerender } = renderHook(() => useAgendaProperties(''), {
    wrapper: AgendaQueryTestProvider,
  })
  await waitFor(() => expect(result.current.data?.pages[0].items[0].id).toBe('private'))
  session.user.id = 'u2'
  rerender()
  expect(result.current.data).toBeUndefined()
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  session.role = 'RENTER'
  rerender()
  expect(result.current.data).toBeUndefined()
  await waitFor(() => expect(agendaService.listProperties).toHaveBeenCalledTimes(3))
  expect(result.current.allowCustom).toBe(false)
})
it('não consulta sem identidade resolvida', () => {
  session.user.id = ''
  renderHook(() => useAgendaProperties(''), { wrapper: AgendaQueryTestProvider })
  expect(agendaService.listProperties).not.toHaveBeenCalled()
})
