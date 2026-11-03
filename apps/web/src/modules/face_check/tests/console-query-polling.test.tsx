import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { makeQueryClient } from '@shared/lib/query/query-client'

import { consoleKeys } from '../hooks/console-query-keys'
import { useOverview, useSession, useSessionList } from '../hooks/use-console-queries'
import { normalizeApiError } from '../services/api-error'
import { consoleService } from '../services/console-service'
import type { SessionListResult } from '../types'

vi.mock('@shared/hooks/use-tenant-session-scope', () => ({ useTenantSessionScope: vi.fn() }))
vi.mock('../services/console-service', () => ({
  consoleService: { listSessions: vi.fn(), getSession: vi.fn(), getOverview: vi.fn() },
}))

const listQuery = { filter: 'all', search: '', page: 0, pageSize: 10 } as const
const empty: SessionListResult = {
  items: [],
  total: 0,
  counts: { all: 0, review: 0, open: 0, redo: 0, approved: 0, rejected: 0, closed: 0 },
}
const clients: ReturnType<typeof makeQueryClient>[] = []

function renderConsoleHook<Result>(hook: () => Result, client = makeQueryClient()) {
  if (!clients.includes(client)) clients.push(client)
  const view = renderHook(hook, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  return { ...view, client }
}

async function advance(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(useTenantSessionScope).mockReturnValue({
    tenantId: 'agency',
    userId: 'owner',
    role: 'OWNER',
    actorKey: ['owner', 'OWNER'],
    enabled: true,
    session: null,
  })
  vi.mocked(consoleService.listSessions).mockResolvedValue(empty)
})

afterEach(() => {
  cleanup()
  for (const client of clients.splice(0)) client.clear()
  vi.useRealTimers()
  vi.resetAllMocks()
})

describe('Face Check console request cadence', () => {
  it('refreshes an empty list every thirty seconds instead of polling every few seconds', async () => {
    const view = renderConsoleHook(() => useSessionList(listQuery))
    await advance()
    expect(view.result.current.data).toEqual(empty)
    expect(consoleService.listSessions).toHaveBeenCalledTimes(1)
    await advance(29_999)
    expect(consoleService.listSessions).toHaveBeenCalledTimes(1)
    await advance(1)
    expect(consoleService.listSessions).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['sessions', () => useSessionList(listQuery), consoleService.listSessions],
    ['overview', () => useOverview('real'), consoleService.getOverview],
    ['detail', () => useSession('verification'), consoleService.getSession],
  ] as const)(
    'does not retry or poll %s when secure storage is unconfigured',
    async (_, hook, request) => {
      const error = normalizeApiError({ error: { code: 'STORAGE_UNAVAILABLE' } }, 503)
      vi.mocked(request).mockRejectedValue(error)
      const view = renderConsoleHook(() => ({ error: hook().error }))
      await advance()
      expect(view.result.current.error).toBe(error)
      await advance(120_000)
      expect(request).toHaveBeenCalledTimes(1)
    },
  )

  it.each([401, 403, 404])(
    'stops automatic requests when access is denied with HTTP %s',
    async (status) => {
      const error = normalizeApiError({ error: { code: 'SESSION_NOT_FOUND' } }, status)
      vi.mocked(consoleService.listSessions).mockRejectedValue(error)
      const view = renderConsoleHook(() => useSessionList(listQuery))
      await advance()
      expect(view.result.current.error).toBe(error)
      await advance(120_000)
      expect(consoleService.listSessions).toHaveBeenCalledTimes(1)
    },
  )

  it('pauses polling after a storage failure even when an earlier list is cached', async () => {
    const view = renderConsoleHook(() => useSessionList(listQuery))
    await advance()
    const error = normalizeApiError({ error: { code: 'STORAGE_UNAVAILABLE' } }, 503)
    vi.mocked(consoleService.listSessions).mockRejectedValue(error)
    await advance(30_000)
    await advance(1)
    expect(view.result.current.error).toBe(error)
    await advance(120_000)
    expect(consoleService.listSessions).toHaveBeenCalledTimes(2)

    vi.mocked(consoleService.listSessions).mockResolvedValue(empty)
    await act(async () => {
      await view.result.current.refetch()
    })
    await advance(1)
    expect(view.result.current.error).toBeNull()
    expect(consoleService.listSessions).toHaveBeenCalledTimes(3)
    await advance(30_000)
    expect(consoleService.listSessions).toHaveBeenCalledTimes(4)
  })

  it('retries a transient network error once after five seconds', async () => {
    vi.mocked(consoleService.listSessions).mockRejectedValue(
      normalizeApiError(new Error('Network unavailable')),
    )
    const view = renderConsoleHook(() => useSessionList(listQuery))
    await advance()
    expect(consoleService.listSessions).toHaveBeenCalledTimes(1)
    await advance(4_999)
    expect(consoleService.listSessions).toHaveBeenCalledTimes(1)
    await advance(1)
    expect(consoleService.listSessions).toHaveBeenCalledTimes(2)
    await advance(1)
    expect(view.result.current.isError).toBe(true)
  })

  it('reuses a fresh list when navigating back to the sessions screen', async () => {
    const view = renderConsoleHook(() => useSessionList(listQuery))
    await advance()
    view.unmount()
    renderConsoleHook(() => useSessionList(listQuery), view.client)
    await advance()
    expect(consoleService.listSessions).toHaveBeenCalledTimes(1)
  })

  it('does not restart failed storage requests when the screen remounts', async () => {
    vi.mocked(consoleService.listSessions).mockRejectedValue(
      normalizeApiError({ error: { code: 'STORAGE_UNAVAILABLE' } }, 503),
    )
    const view = renderConsoleHook(() => useSessionList(listQuery))
    await advance()
    view.unmount()
    renderConsoleHook(() => useSessionList(listQuery), view.client)
    await advance(30_000)
    expect(consoleService.listSessions).toHaveBeenCalledTimes(1)
  })

  it('still refreshes immediately when a mutation invalidates the session list', async () => {
    const view = renderConsoleHook(() => useSessionList(listQuery))
    await advance()
    await act(async () => {
      await view.client.invalidateQueries({ queryKey: consoleKeys.sessions })
    })
    expect(consoleService.listSessions).toHaveBeenCalledTimes(2)
  })
})
