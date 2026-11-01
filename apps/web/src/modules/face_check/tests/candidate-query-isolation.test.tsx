import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'

import { useCandidateVerifications } from '../hooks/use-candidate-verifications'
import { candidateService } from '../services/candidate-service'
import type { CandidateVerificationsResponse } from '../types/candidate.types'

vi.mock('@shared/hooks/use-tenant-session-scope', () => ({ useTenantSessionScope: vi.fn() }))
vi.mock('../services/candidate-service', () => ({ candidateService: { list: vi.fn() } }))

function scope(
  tenantId: string,
  userId: string,
  enabled = true,
  accessToken: string | null = `token-${tenantId}-${userId}`,
) {
  vi.mocked(useTenantSessionScope).mockReturnValue({
    tenantId,
    userId,
    role: 'RENTER',
    enabled,
    actorKey: [userId, 'RENTER'],
    session: {
      user: { id: userId },
      tenantId,
      role: 'RENTER',
      scope: 'tenant',
      accessToken: accessToken ?? undefined,
      expires: '2099-01-01T00:00:00Z',
    },
  })
}

const initial: CandidateVerificationsResponse = {
  items: [
    {
      id: 'private-invitation',
      propertyTitle: 'Previous account property',
      agencyName: 'Previous agency',
      status: 'CREATED',
      createdAt: '2026-11-01T12:00:00Z',
      expiresAt: '2026-11-08T12:00:00Z',
      captureUrl: '/pt/face_check/verify/previous-account-token',
    },
  ],
}

describe('candidate verification cache isolation', () => {
  afterEach(() => vi.resetAllMocks())

  it('does not request candidate data before the tenant session is ready', () => {
    scope('tenant-a', 'candidate-a', false)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const view = renderHook(() => useCandidateVerifications(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    })
    expect(candidateService.list).not.toHaveBeenCalled()
    expect(view.result.current.data).toBeUndefined()
    view.unmount()
    client.clear()
  })

  it('does not fetch without the current account token even when the tenant scope is ready', () => {
    scope('tenant-a', 'candidate-a', true, null)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const view = renderHook(() => useCandidateVerifications(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    })
    expect(candidateService.list).not.toHaveBeenCalled()
    expect(view.result.current.data).toBeUndefined()
    view.unmount()
    client.clear()
  })

  it.each([
    ['tenant-a', 'candidate-b'],
    ['tenant-b', 'candidate-a'],
  ])(
    'does not reuse the previous account list for tenant %s and actor %s',
    async (tenantId, userId) => {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      let finishNext: (response: CandidateVerificationsResponse) => void = () => undefined
      vi.mocked(candidateService.list)
        .mockResolvedValueOnce(initial)
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              finishNext = resolve
            }),
        )
      scope('tenant-a', 'candidate-a')
      const view = renderHook(() => useCandidateVerifications(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      })
      await waitFor(() => expect(view.result.current.data?.items[0].id).toBe('private-invitation'))
      expect(vi.mocked(candidateService.list).mock.calls[0][1]).toBe('token-tenant-a-candidate-a')
      scope(tenantId, userId)
      view.rerender()
      expect(view.result.current.data).toBeUndefined()
      await waitFor(() => expect(candidateService.list).toHaveBeenCalledTimes(2))
      expect(vi.mocked(candidateService.list).mock.calls[1][1]).toBe(`token-${tenantId}-${userId}`)
      finishNext({ items: [] })
      await waitFor(() => expect(view.result.current.data?.items).toEqual([]))
      view.unmount()
      client.clear()
    },
  )

  it.each([
    ['tenant-a', 'candidate-b'],
    ['tenant-b', 'candidate-a'],
  ])(
    'cancels the previous request after switching to tenant %s and actor %s',
    async (tenantId, userId) => {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      vi.mocked(candidateService.list).mockImplementation(() => new Promise(() => undefined))
      scope('tenant-a', 'candidate-a')
      const view = renderHook(() => useCandidateVerifications(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      })
      await waitFor(() => expect(candidateService.list).toHaveBeenCalledTimes(1))
      const previousSignal = vi.mocked(candidateService.list).mock.calls[0][0]
      expect(previousSignal?.aborted).toBe(false)
      scope(tenantId, userId)
      view.rerender()
      await waitFor(() => expect(previousSignal?.aborted).toBe(true))
      await waitFor(() => expect(candidateService.list).toHaveBeenCalledTimes(2))
      const currentSignal = vi.mocked(candidateService.list).mock.calls[1][0]
      expect(currentSignal?.aborted).toBe(false)
      view.unmount()
      expect(currentSignal?.aborted).toBe(true)
      client.clear()
    },
  )
})
