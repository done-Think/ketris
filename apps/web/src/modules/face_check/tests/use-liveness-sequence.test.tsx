import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLivenessSequence } from '../hooks/use-liveness-sequence'
import { captureService } from '../services/capture-service'
import { ApiError } from '../services/api-error'
import type { LivenessSequenceOptions } from '../types/liveness-sequence.types'

vi.mock('../services/capture-service', () => ({ captureService: { prepareLiveness: vi.fn() } }))
const start = vi.mocked(captureService.prepareLiveness)
const steps = ['turnLeft', 'turnRight', 'closer'] as const
const plan = { planId: '11111111-1111-4111-8111-111111111111', expiresAt: '2099-11-01T12:00:00Z' }

function fixture() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const capture = vi.fn<LivenessSequenceOptions['capture']>()
  capture.mockResolvedValue(undefined)
  const options: LivenessSequenceOptions = {
    token: 'token',
    enabled: true,
    planId: null,
    localStep: 0,
    onPlan: vi.fn(),
    capture,
    onProgress: vi.fn(),
    prepareSound: vi.fn(),
    tickSound: vi.fn(),
  }
  const view = renderHook((enabled: boolean) => useLivenessSequence({ ...options, enabled }), {
    initialProps: true,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  return { ...view, options, capture, client }
}
async function advance(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  start.mockResolvedValue({ ...plan, challenges: [...steps], step: 0 })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('automatic liveness capture', () => {
  it('captures left then right then proximity after three seconds per movement, using one click', async () => {
    const h = fixture()
    act(() => {
      void h.result.current.start()
      void h.result.current.start()
    })
    await advance()
    expect(start).toHaveBeenCalledOnce()
    expect(h.result.current.remaining).toBe(3)
    await advance(2999)
    expect(h.capture).not.toHaveBeenCalled()
    await advance(1)
    expect(h.capture.mock.calls.map(([step]) => step)).toEqual(['turnLeft'])
    expect(h.result.current.remaining).toBe(3)
    await advance(3000)
    expect(h.capture.mock.calls.map(([step]) => step)).toEqual(['turnLeft', 'turnRight'])
    await advance(3000)
    expect(h.capture.mock.calls.map(([step]) => step)).toEqual([...steps])
    expect(h.options.tickSound).toHaveBeenCalledTimes(9)
    expect(h.options.prepareSound).toHaveBeenCalledOnce()
    expect(h.options.onProgress).toHaveBeenLastCalledWith(4)
    expect(h.result.current.running).toBe(false)
    expect(h.result.current.error).toBeNull()
  })

  it('stops on a right-turn failure and resumes only the pending right and proximity', async () => {
    const h = fixture()
    h.capture.mockImplementation(async (challenge) => {
      if (challenge === 'turnRight') throw new ApiError('LIVENESS_FAILED', 422, 'livenessNotTurned')
    })
    act(() => {
      void h.result.current.start()
    })
    await advance(9000)
    expect(h.capture.mock.calls.map(([step]) => step)).toEqual(['turnLeft', 'turnRight'])
    expect(h.result.current.running).toBe(false)
    start.mockResolvedValue({ ...plan, challenges: [...steps], step: 1 })
    h.capture.mockResolvedValue(undefined)
    act(() => {
      void h.result.current.start()
    })
    await advance(6000)
    expect(h.capture.mock.calls.map(([step]) => step)).toEqual([
      'turnLeft',
      'turnRight',
      'turnRight',
      'closer',
    ])
    expect(h.result.current.error).toBeNull()
  })

  it.each(['pause', 'camera', 'hidden', 'unmount'])(
    'cancels the countdown on %s without sending another photo',
    async (reason) => {
      const h = fixture()
      act(() => {
        void h.result.current.start()
      })
      await advance(1000)
      if (reason === 'pause') act(() => h.result.current.stop())
      if (reason === 'camera') h.rerender(false)
      if (reason === 'hidden') {
        vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
        fireEvent(document, new Event('visibilitychange'))
      }
      if (reason === 'unmount') h.unmount()
      await advance(10_000)
      expect(h.capture).not.toHaveBeenCalled()
      if (reason !== 'unmount') expect(h.result.current.running).toBe(false)
    },
  )

  it('does not repeat captures whose acknowledgement was lost', async () => {
    const h = fixture()
    start.mockResolvedValue({ ...plan, challenges: [...steps], step: 2 })
    act(() => {
      void h.result.current.start()
    })
    await advance(3000)
    expect(h.capture.mock.calls.map(([step]) => step)).toEqual(['closer'])
    expect(h.options.onProgress).toHaveBeenLastCalledWith(4)
  })
})
