import { act, fireEvent, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraStream } from '../hooks/use-camera-stream'

const getUserMedia = vi.fn()
function media() {
  const track: MediaStreamTrack = Object.assign(new EventTarget(), {
    contentHint: '',
    enabled: true,
    id: 'camera-track',
    kind: 'video',
    label: 'Test camera',
    muted: false,
    onended: null,
    onmute: null,
    onunmute: null,
    readyState: 'live' as const,
    stop: vi.fn(),
    applyConstraints: async () => {},
    getCapabilities: () => ({}),
    getConstraints: () => ({}),
    getSettings: () => ({}),
    clone: (): MediaStreamTrack => track,
  })
  const stream: MediaStream = Object.assign(new EventTarget(), {
    active: true,
    id: 'camera-stream',
    onaddtrack: null,
    onremovetrack: null,
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: (): MediaStream => stream,
    getAudioTracks: () => [],
    getTrackById: (id: string) => (id === track.id ? track : null),
    getTracks: () => [track],
    getVideoTracks: () => [track],
  })
  return { stream, track }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('isSecureContext', true)
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
})
afterEach(() => vi.unstubAllGlobals())

describe('camera permissions and hardware', () => {
  it.each(['environment', 'user'] as const)(
    'requests permission for %s without audio and stops on unmount',
    async (facing) => {
      const { stream, track } = media()
      getUserMedia.mockResolvedValue(stream)
      const view = renderHook(() => useCameraStream(facing))
      await waitFor(() => expect(getUserMedia).toHaveBeenCalledOnce())
      expect(getUserMedia).toHaveBeenCalledWith({
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
          resizeMode: { ideal: 'none' },
          frameRate: { ideal: 30, max: 30 },
        },
      })
      const video = document.createElement('video')
      act(() => view.result.current.attachVideo(video))
      fireEvent.loadedData(video)
      await waitFor(() => expect(view.result.current.status).toBe('live'))
      view.unmount()
      expect(track.stop).toHaveBeenCalledOnce()
    },
  )

  it.each([
    ['NotFoundError', 'notFound'],
    ['DevicesNotFoundError', 'notFound'],
    ['NotAllowedError', 'denied'],
    ['SecurityError', 'denied'],
    ['NotReadableError', 'unavailable'],
  ])('distinguishes %s as %s', async (name, status) => {
    getUserMedia.mockRejectedValue(new DOMException('Camera error', name))
    const { result } = renderHook(() => useCameraStream('user'))
    await waitFor(() => expect(result.current.status).toBe(status))
    expect(getUserMedia).toHaveBeenCalledOnce()
  })

  it.each(['OverconstrainedError', 'ConstraintNotSatisfiedError'])(
    'keeps a lower-resolution camera usable after %s without requesting audio',
    async (name) => {
      const { stream, track } = media()
      getUserMedia.mockRejectedValueOnce({ name }).mockResolvedValueOnce(stream)
      const view = renderHook(() => useCameraStream('user'))
      await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2))
      const fallback = getUserMedia.mock.calls[1][0]
      expect(fallback).toMatchObject({ audio: false, video: { facingMode: { ideal: 'user' } } })
      expect(fallback.video.width).not.toHaveProperty('min')
      expect(fallback.video.height).not.toHaveProperty('min')
      const video = document.createElement('video')
      act(() => view.result.current.attachVideo(video))
      fireEvent.loadedData(video)
      await waitFor(() => expect(view.result.current.status).toBe('live'))
      view.unmount()
      expect(track.stop).toHaveBeenCalledOnce()
    },
  )

  it('does not retry resolution negotiation after the capture screen is closed', async () => {
    let reject!: (reason: unknown) => void
    getUserMedia.mockImplementationOnce(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail
        }),
    )
    const view = renderHook(() => useCameraStream('user'))
    view.unmount()
    await act(async () => {
      reject(new DOMException('Unsupported resolution', 'OverconstrainedError'))
    })
    expect(getUserMedia).toHaveBeenCalledOnce()
  })

  it('does not request media in an insecure context or unsupported browser', async () => {
    vi.stubGlobal('isSecureContext', false)
    const first = renderHook(() => useCameraStream('user'))
    await waitFor(() => expect(first.result.current.status).toBe('insecure'))
    first.unmount()
    vi.stubGlobal('isSecureContext', true)
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined })
    const second = renderHook(() => useCameraStream('user'))
    await waitFor(() => expect(second.result.current.status).toBe('unsupported'))
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('allows a new permission attempt and handles a camera disconnected during capture', async () => {
    const { stream, track } = media()
    getUserMedia
      .mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'))
      .mockResolvedValue(stream)
    const view = renderHook(() => useCameraStream('user'))
    await waitFor(() => expect(view.result.current.status).toBe('denied'))
    act(() => view.result.current.restart())
    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2))
    act(() => track.dispatchEvent(new Event('ended')))
    await waitFor(() => expect(view.result.current.status).toBe('unavailable'))
    view.unmount()
    expect(track.stop).toHaveBeenCalledOnce()
  })

  it('releases a stream if permission is granted after the screen is closed', async () => {
    const { stream, track } = media()
    let resolve!: (stream: MediaStream) => void
    getUserMedia.mockImplementation(
      () =>
        new Promise<MediaStream>((done) => {
          resolve = done
        }),
    )
    const view = renderHook(() => useCameraStream('user'))
    view.unmount()
    await act(async () => {
      resolve(stream)
    })
    expect(track.stop).toHaveBeenCalledOnce()
  })
})
