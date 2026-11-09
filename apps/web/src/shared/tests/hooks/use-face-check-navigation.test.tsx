import { act, renderHook, waitFor } from '@testing-library/react'
import type { Session } from 'next-auth'
import { useSession } from 'next-auth/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useFaceCheckNavigation } from '@shared/hooks/use-face-check-navigation'

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))

function session(
  tenantId: string,
  userId: string,
  token: string,
  overrides: Partial<Session> = {},
) {
  const data: Session = {
    user: { id: userId },
    expires: '2099-01-01T00:00:00Z',
    scope: 'tenant',
    tenantId,
    role: 'RENTER',
    accessToken: token,
    ...overrides,
  }
  vi.mocked(useSession).mockReturnValue({ data, status: 'authenticated', update: vi.fn() })
}

describe('Face Check navigation capabilities', () => {
  const fetchMock = vi.fn<typeof fetch>()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    session('tenant-a', 'candidate-a', 'token-a')
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  it('allows a RENTER to see candidate requests without exposing management navigation', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ allowed: false, candidateVerifications: true }), {
        status: 200,
      }),
    )
    const view = renderHook(() => useFaceCheckNavigation())
    await waitFor(() =>
      expect(view.result.current).toEqual({ canManage: false, hasRequests: true }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/face_check/access',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer token-a', 'X-Ketris-Api-Version': '3' },
      }),
    )
    view.unmount()
  })

  it('hides previous capabilities and aborts the old request when the account changes', async () => {
    let finishNext: (response: Response) => void = () => undefined
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ allowed: true, candidateVerifications: true }), {
          status: 200,
        }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishNext = resolve
          }),
      )
    const view = renderHook(() => useFaceCheckNavigation())
    await waitFor(() => expect(view.result.current.canManage).toBe(true))
    const previousSignal = fetchMock.mock.calls[0][1]?.signal
    session('tenant-b', 'candidate-b', 'token-b')
    view.rerender()
    expect(view.result.current).toEqual({ canManage: false, hasRequests: false })
    expect(previousSignal?.aborted).toBe(true)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await act(async () => {
      finishNext(
        new Response(JSON.stringify({ allowed: false, candidateVerifications: true }), {
          status: 200,
        }),
      )
    })
    await waitFor(() =>
      expect(view.result.current).toEqual({ canManage: false, hasRequests: true }),
    )
    const currentSignal = fetchMock.mock.calls[1][1]?.signal
    view.unmount()
    expect(currentSignal?.aborted).toBe(true)
  })

  it('ignores a delayed capability response belonging to an earlier actor', async () => {
    let finishPrevious: (response: Response) => void = () => undefined
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishPrevious = resolve
          }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ allowed: false, candidateVerifications: false }), {
          status: 200,
        }),
      )
    const view = renderHook(() => useFaceCheckNavigation())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    session('tenant-a', 'candidate-b', 'token-b')
    view.rerender()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await act(async () => {
      finishPrevious(
        new Response(JSON.stringify({ allowed: true, candidateVerifications: true }), {
          status: 200,
        }),
      )
    })
    expect(view.result.current).toEqual({ canManage: false, hasRequests: false })
    view.unmount()
  })

  it('does not request capabilities when authentication is unavailable', () => {
    session('tenant-a', 'candidate-a', 'token-a', { authUnavailable: true })
    const view = renderHook(() => useFaceCheckNavigation())
    expect(fetchMock).not.toHaveBeenCalled()
    expect(view.result.current).toEqual({ canManage: false, hasRequests: false })
    view.unmount()
  })
})
