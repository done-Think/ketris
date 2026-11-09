import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'

import { useSessionList } from '../hooks/use-console-queries'
import { consoleService } from '../services/console-service'
import type { SessionListResult } from '../types'

vi.mock('@shared/hooks/use-tenant-session-scope', () => ({ useTenantSessionScope: vi.fn() }))
vi.mock('../services/console-service', () => ({ consoleService: { listSessions: vi.fn() } }))

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
