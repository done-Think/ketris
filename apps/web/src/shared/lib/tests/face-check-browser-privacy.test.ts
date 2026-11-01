import { afterEach, describe, expect, it, vi } from 'vitest'
import { installFaceCheckBrowserPrivacy } from '../face-check-browser-privacy'
import {
  faceCheckBrowserPrivacyActive,
  setFaceCheckBrowserPrivacy,
} from '../face-check-telemetry-privacy'

afterEach(() => {
  document.body.replaceChildren()
  document.documentElement.classList.remove('sentry-block')
  window.history.replaceState({}, '', '/pt/dashboard')
  setFaceCheckBrowserPrivacy(false)
})

describe('FaceCheck browser recording isolation', () => {
  it('stops without flushing before a private navigation and resumes only after private DOM is gone', async () => {
    window.history.replaceState({}, '', '/pt/dashboard')
    let finishStop!: () => void
    const stop = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishStop = resolve
        }),
    )
    const replay = {
      stop,
      start: vi.fn(),
      startBuffering: vi.fn(),
      getRecordingMode: () => 'buffer' as const,
    }
    const sdk = { getReplay: () => replay, addReplay: vi.fn(), clearBreadcrumbs: vi.fn() }
    const privacy = installFaceCheckBrowserPrivacy(sdk)
    try {
      expect(privacy.transition('/pt/face_check/verify/private-token')).toBe(true)
      expect(stop).toHaveBeenCalledWith({ flush: false })
      expect(faceCheckBrowserPrivacyActive()).toBe(true)
      await Promise.resolve()
      expect(faceCheckBrowserPrivacyActive()).toBe(true)
      const privateDom = document.createElement('div')
      privateDom.dataset.faceCheckPrivate = 'true'
      document.body.append(privateDom)
      window.history.replaceState({}, '', '/pt/face_check/verify/private-token')
      window.dispatchEvent(new PopStateEvent('popstate'))
      privacy.transition('/pt/dashboard')
      window.history.replaceState({}, '', '/pt/dashboard')
      window.dispatchEvent(new PopStateEvent('popstate'))
      expect(replay.startBuffering).not.toHaveBeenCalled()
      privateDom.remove()
      finishStop()
      await vi.waitFor(() => expect(faceCheckBrowserPrivacyActive()).toBe(false))
      expect(replay.startBuffering).toHaveBeenCalledTimes(1)
      expect(replay.start).not.toHaveBeenCalled()
      expect(sdk.clearBreadcrumbs).toHaveBeenCalledTimes(2)
      expect(document.documentElement.classList.contains('sentry-block')).toBe(false)
    } finally {
      privacy.stop()
    }
  })

  it('keeps an initial public capture private and can initialize normal Replay after leaving it', async () => {
    window.history.replaceState({}, '', '/en/face_check/verify/private-token')
    const sdk = { getReplay: () => undefined, addReplay: vi.fn(), clearBreadcrumbs: vi.fn() }
    const privacy = installFaceCheckBrowserPrivacy(sdk)
    try {
      expect(faceCheckBrowserPrivacyActive()).toBe(true)
      expect(sdk.addReplay).not.toHaveBeenCalled()
      privacy.transition('/en/dashboard')
      window.history.replaceState({}, '', '/en/dashboard')
      window.dispatchEvent(new PopStateEvent('popstate'))
      await vi.waitFor(() => expect(sdk.addReplay).toHaveBeenCalledTimes(1))
      expect(faceCheckBrowserPrivacyActive()).toBe(false)
    } finally {
      privacy.stop()
    }
  })
})
