import { describe, expect, it, vi } from 'vitest'
import { configureCameraQuality } from '../utils/camera-quality'
import type { CameraTrackCapabilities } from '../types/native-camera.types'

function camera(capabilities: CameraTrackCapabilities, settings: MediaTrackSettings) {
  let constraints: MediaTrackConstraints = { deviceId: { exact: 'chosen-camera' } }
  const apply = vi.fn(async (next: MediaTrackConstraints) => {
    constraints = next
  })
  const track = {
    getCapabilities: () => capabilities,
    getSettings: () => settings,
    getConstraints: () => constraints,
    applyConstraints: apply,
  } as unknown as MediaStreamTrack
  return { track, apply }
}

describe('camera quality negotiation', () => {
  it('enables supported autofocus even when the stream is already at maximum resolution', async () => {
    const { track, apply } = camera(
      {
        width: { max: 1920 },
        height: { max: 1080 },
        focusMode: ['manual', 'continuous'],
      },
      { width: 1920, height: 1080 },
    )
    await configureCameraQuality(track)
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ focusMode: 'continuous' }))
    expect(track.getConstraints()).toMatchObject({ deviceId: { exact: 'chosen-camera' } })
  })

  it('does not let a rejected focus control discard the resolution upgrade or exposure controls', async () => {
    const { track, apply } = camera(
      {
        width: { max: 1920 },
        height: { max: 1080 },
        focusMode: ['continuous'],
        exposureMode: ['continuous'],
        whiteBalanceMode: ['continuous'],
      },
      { width: 640, height: 480 },
    )
    apply.mockImplementation(async (next) => {
      if ('focusMode' in next) throw new DOMException('Control rejected', 'OverconstrainedError')
    })
    await configureCameraQuality(track)
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ width: { ideal: 1920 } }))
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ exposureMode: 'continuous' }))
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ whiteBalanceMode: 'continuous' }))
  })

  it('still configures autofocus when the device rejects a resolution combination', async () => {
    const { track, apply } = camera(
      {
        width: { max: 3840 },
        height: { max: 2160 },
        focusMode: ['continuous'],
      },
      { width: 1280, height: 720 },
    )
    apply.mockRejectedValueOnce(new DOMException('Unsupported combination', 'OverconstrainedError'))
    await configureCameraQuality(track)
    expect(apply).toHaveBeenLastCalledWith(expect.objectContaining({ focusMode: 'continuous' }))
  })

  it('preserves the chosen camera and resolution while applying independent automatic controls', async () => {
    const { track } = camera(
      {
        width: { max: 1920 },
        height: { max: 1080 },
        focusMode: ['continuous'],
        exposureMode: ['continuous'],
        whiteBalanceMode: ['continuous'],
      },
      { width: 640, height: 480 },
    )
    await configureCameraQuality(track)
    expect(track.getConstraints()).toMatchObject({
      deviceId: { exact: 'chosen-camera' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      focusMode: 'continuous',
      exposureMode: 'continuous',
      whiteBalanceMode: 'continuous',
    })
  })

  it('leaves fixed-focus 720p cameras at their native resolution without inventing controls', async () => {
    const { track, apply } = camera(
      { width: { max: 1280 }, height: { max: 720 } },
      { width: 1280, height: 720 },
    )
    await configureCameraQuality(track)
    expect(apply).not.toHaveBeenCalled()
  })
})
