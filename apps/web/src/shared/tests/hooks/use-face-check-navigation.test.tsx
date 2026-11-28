import { act, renderHook, waitFor } from '@testing-library/react'
import type { Session } from 'next-auth'
import { useSession } from 'next-auth/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useFaceCheckNavigation } from '@shared/hooks/use-face-check-navigation'
import { httpClient } from '@shared/lib/api/http-client'

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))
vi.mock('@shared/lib/api/http-client', () => ({ httpClient: { get: vi.fn() } }))

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
  const fetchMock = vi.mocked(httpClient.get)
  beforeEach(() => {
    session('tenant-a', 'candidate-a', 'token-a')
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('allows a RENTER to see candidate requests without exposing management navigation', async () => {
    fetchMock.mockResolvedValue({ allowed: false, candidateVerifications: true })
    const view = renderHook(() => useFaceCheckNavigation())
    await waitFor(() =>
      expect(view.result.current).toEqual({
        canManage: false,
        hasRequests: true,
        isLoading: false,
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/face_check/access',
      expect.objectContaining({
        sessionAccessToken: 'token-a',
        headers: { Authorization: 'Bearer token-a' },
      }),
    )
    view.unmount()
  })

  it('hides previous capabilities and aborts the old request when the account changes', async () => {
    let finishNext: (response: {
      allowed: boolean
      candidateVerifications: boolean
    }) => void = () => undefined
    fetchMock
      .mockResolvedValueOnce({ allowed: true, candidateVerifications: true })
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
    expect(view.result.current).toEqual({ canManage: false, hasRequests: false, isLoading: true })
    expect(previousSignal?.aborted).toBe(true)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await act(async () => {
      finishNext({ allowed: false, candidateVerifications: true })
    })
    await waitFor(() =>
      expect(view.result.current).toEqual({
        canManage: false,
        hasRequests: true,
        isLoading: false,
      }),
    )
    const currentSignal = fetchMock.mock.calls[1][1]?.signal
    view.unmount()
    expect(currentSignal?.aborted).toBe(true)
  })

  it('ignores a delayed capability response belonging to an earlier actor', async () => {
    let finishPrevious: (response: {
      allowed: boolean
      candidateVerifications: boolean
    }) => void = () => undefined
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishPrevious = resolve
          }),
      )
      .mockResolvedValueOnce({ allowed: false, candidateVerifications: false })
    const view = renderHook(() => useFaceCheckNavigation())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    session('tenant-a', 'candidate-b', 'token-b')
    view.rerender()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await act(async () => {
      finishPrevious({ allowed: true, candidateVerifications: true })
    })
    expect(view.result.current).toEqual({ canManage: false, hasRequests: false, isLoading: false })
    view.unmount()
  })

  it('does not request capabilities when authentication is unavailable', () => {
    session('tenant-a', 'candidate-a', 'token-a', { authUnavailable: true })
    const view = renderHook(() => useFaceCheckNavigation())
    expect(fetchMock).not.toHaveBeenCalled()
    expect(view.result.current).toEqual({ canManage: false, hasRequests: false, isLoading: false })
    view.unmount()
  })

  it('keeps navigation loading until access is resolved and settles after a failure', async () => {
    let rejectAccess: (error: Error) => void = () => undefined
    fetchMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectAccess = reject
        }),
    )
    const view = renderHook(() => useFaceCheckNavigation())
    expect(view.result.current.isLoading).toBe(true)
    await act(async () => rejectAccess(new Error('access unavailable')))
    expect(view.result.current).toEqual({
      canManage: false,
      hasRequests: false,
      isLoading: false,
    })
  })
})
