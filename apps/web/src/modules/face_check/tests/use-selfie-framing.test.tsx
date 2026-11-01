import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSelfieFraming } from '../hooks/use-selfie-framing'
import { captureService } from '../services/capture-service'
import { ApiError } from '../services/api-error'
import type { FaceFramingResult } from '../types/face-framing.types'

vi.mock('../services/capture-service', () => ({ captureService: { framing: vi.fn() } }))
const framing = vi.mocked(captureService.framing)
const good: FaceFramingResult = {
  width: 640,
  height: 360,
  faceCount: 1,
  face: { x: 0.36, y: 0.2, width: 0.28, height: 0.6 },
}
const options = {
  token: 'token',
  enabled: true,
  sampleFrame: vi.fn(async () => new Blob(['synthetic'])),
  geometry: { width: 560, height: 420, guide: { x: 162, y: 54, width: 236, height: 312 } },
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  framing.mockResolvedValue(good)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
async function advance(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('live face placement feedback', () => {
  it('requires stable placement and resets the green state as soon as the face moves', async () => {
    const view = renderHook(() => useSelfieFraming(options))
    await advance()
    expect(view.result.current).toBe('checking')
    await advance(1500)
    expect(view.result.current).toBe('ready')
    framing.mockResolvedValue({ ...good, face: { x: 0.1, y: 0.2, width: 0.28, height: 0.6 } })
    await advance(1500)
    expect(view.result.current).toBe('offCenter')
  })

  it('never overlaps slow probes and aborts pending requests when the stage is left', async () => {
    framing.mockImplementationOnce(() => new Promise(() => {}))
    const view = renderHook(() => useSelfieFraming(options))
    await advance(6000)
    expect(framing).toHaveBeenCalledOnce()
    const signal = framing.mock.calls[0][2]
    view.unmount()
    expect(signal.aborted).toBe(true)
    await advance(6000)
    expect(framing).toHaveBeenCalledOnce()
  })

  it('ignores late answers for an old token and restarts stability for a new session', async () => {
    let resolve!: (result: FaceFramingResult) => void
    framing.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const view = renderHook((token: string) => useSelfieFraming({ ...options, token }), {
      initialProps: 'old',
    })
    await advance()
    view.rerender('new')
    await advance()
    await act(async () => {
      resolve(good)
    })
    expect(view.result.current).toBe('checking')
    await advance(1500)
    expect(view.result.current).toBe('ready')
    expect(framing.mock.calls.map(([token]) => token)).toEqual(['old', 'new', 'new'])
  })

  it('stops after expired access and backs off rate limits without claiming good positioning', async () => {
    framing.mockRejectedValue(new ApiError('SESSION_EXPIRED', 401))
    const view = renderHook(() => useSelfieFraming(options))
    await advance(30_000)
    expect(view.result.current).toBe('unavailable')
    expect(framing).toHaveBeenCalledOnce()
    view.unmount()
    framing.mockReset().mockRejectedValue(new ApiError('RATE_LIMITED', 429))
    const second = renderHook(() => useSelfieFraming(options))
    await advance(59_999)
    expect(framing).toHaveBeenCalledOnce()
    await advance(1)
    expect(framing).toHaveBeenCalledTimes(2)
    expect(second.result.current).toBe('unavailable')
  })

  it('does not sample before consent flow reaches the enabled selfie stage and a measured oval', async () => {
    const view = renderHook(() => useSelfieFraming({ ...options, enabled: false, geometry: null }))
    await advance(3000)
    expect(framing).not.toHaveBeenCalled()
    expect(options.sampleFrame).not.toHaveBeenCalled()
    expect(view.result.current).toBe('checking')
  })
})
