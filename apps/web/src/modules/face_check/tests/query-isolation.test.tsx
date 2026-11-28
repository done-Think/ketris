import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'

import { useOverview, useSessionList } from '../hooks/use-console-queries'
import { consoleService } from '../services/console-service'
import { ApiError } from '../services/api-error'
import type { SessionListResult } from '../types'

vi.mock('@shared/hooks/use-tenant-session-scope', () => ({ useTenantSessionScope: vi.fn() }))
vi.mock('../services/console-service', () => ({
  consoleService: { listSessions: vi.fn(), getOverview: vi.fn() },
}))

function scope(userId: string) {
  vi.mocked(useTenantSessionScope).mockReturnValue({
    tenantId: 'tenant',
    userId,
    role: 'AGENT',
    enabled: true,
    actorKey: [userId, 'AGENT'],
    session: null,
  })
}

const counts = { all: 0, review: 0, open: 0, redo: 0, approved: 0, rejected: 0, closed: 0 }
const query = { filter: 'all', search: '', page: 0, pageSize: 10 } as const

describe('face_check query isolation', () => {
  afterEach(() => vi.resetAllMocks())

  it.each([401, 403, 404, 503])(
    'stops automatic overview requests after status %s and allows manual retry',
    async (status) => {
      const client = new QueryClient()
      scope('agent-a')
      vi.mocked(consoleService.getOverview).mockRejectedValue(
        new ApiError('STORAGE_UNAVAILABLE', status),
      )
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      )
      const view = renderHook(() => useOverview('real'), { wrapper })
      await waitFor(() => expect(view.result.current.isError).toBe(true))
      expect(consoleService.getOverview).toHaveBeenCalledTimes(1)

      vi.useFakeTimers()
      try {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(10000)
        })
        expect(consoleService.getOverview).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }

      view.unmount()
      const remounted = renderHook(() => useOverview('real'), { wrapper })
      expect(consoleService.getOverview).toHaveBeenCalledTimes(1)
      await act(async () => {
        await remounted.result.current.refetch()
      })
      expect(consoleService.getOverview).toHaveBeenCalledTimes(2)
      remounted.unmount()
      client.clear()
    },
  )

  it('does not show the previous agent list while the next agent loads', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    let finishNext: (value: SessionListResult) => void = () => undefined
    vi.mocked(consoleService.listSessions)
      .mockResolvedValueOnce({ items: [], counts, total: 1 })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishNext = resolve
          }),
      )
    scope('agent-a')
    const view = renderHook(() => useSessionList(query), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    })
    await waitFor(() => expect(view.result.current.data?.total).toBe(1))
    scope('agent-b')
    view.rerender()
    expect(view.result.current.data).toBeUndefined()
    await waitFor(() => expect(consoleService.listSessions).toHaveBeenCalledTimes(2))
    finishNext({ items: [], counts, total: 2 })
    await waitFor(() => expect(view.result.current.data?.total).toBe(2))
    view.unmount()
    client.clear()
  })

  it('cancels the old actor request when the actor changes', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    vi.mocked(consoleService.listSessions).mockImplementation(() => new Promise(() => undefined))
    scope('agent-a')
    const view = renderHook(() => useSessionList(query), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    })
    await waitFor(() => expect(consoleService.listSessions).toHaveBeenCalledTimes(1))
    const signal = vi.mocked(consoleService.listSessions).mock.calls[0][1]
    scope('agent-b')
    view.rerender()
    await waitFor(() => expect(signal?.aborted).toBe(true))
    view.unmount()
    client.clear()
  })
})
