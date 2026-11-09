import { cleanup, renderHook } from '@testing-library/react'
import { createTranslator } from 'next-intl'
import { afterEach, expect, it, vi } from 'vitest'
import { useCaptureDevice } from '../hooks/use-capture-device'
import pt from '../../../i18n/messages/pt-BR/face_check.json'
import en from '../../../i18n/messages/en-US/face_check.json'
import es from '../../../i18n/messages/es-ES/face_check.json'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it.each([
  ['MacIntel', 'Macintosh Chrome', 0, 'computer'],
  ['iPhone', 'iPhone Mobile', 5, 'mobile'],
  ['MacIntel', 'Macintosh Safari', 5, 'mobile'],
  ['Linux', 'Android Mobile Chrome', 5, 'mobile'],
] as const)(
  'recognizes %s %s without using screen width',
  (platform, userAgent, maxTouchPoints, expected) => {
    vi.stubGlobal('navigator', { platform, userAgent, maxTouchPoints })
    expect(renderHook(() => useCaptureDevice()).result.current).toBe(expected)
  },
)

it.each([
  ['pt-BR', pt, 'celular'],
  ['en-US', en, 'phone'],
  ['es-ES', es, 'móvil'],
] as const)(
  'adapts camera recovery instructions to the current device in %s',
  (locale, messages, phone) => {
    const t = createTranslator({ locale, messages, namespace: 'capture.live' })
    for (const hint of [
      'notFoundHint',
      'deniedHint',
      'unavailableHint',
      'unsupportedHint',
    ] as const) {
      expect(t(hint, { device: 'computer' })).toContain(phone)
      for (const device of ['mobile', 'camera']) {
        expect(t(hint, { device })).not.toContain(phone)
        expect(t(hint, { device })).not.toContain('{device')
      }
    }
  },
)

it('uses the browser mobile hint even with a generic user agent', () => {
  vi.stubGlobal('navigator', {
    platform: 'Linux',
    userAgent: 'Browser',
    maxTouchPoints: 0,
    userAgentData: { mobile: true },
  })
  expect(renderHook(() => useCaptureDevice()).result.current).toBe('mobile')
})

it.each([
  ['pt-BR', pt, 'câmera', 'celular'],
  ['en-US', en, 'camera', 'phone'],
  ['es-ES', es, 'cámara', 'móvil'],
] as const)(
  'translates every placement state and device-specific distance hint in %s',
  (locale, messages, camera, phone) => {
    const t = createTranslator({ locale, messages, namespace: 'capture.selfie.framing' })
    for (const key of Object.keys(
      messages.capture.selfie.framing,
    ) as (keyof typeof messages.capture.selfie.framing)[])
      for (const device of ['camera', 'computer', 'mobile'])
        expect(t(key, { device })).not.toBe(`capture.selfie.framing.${key}`)
    for (const key of ['tooFar', 'tooClose', 'closer'] as const) {
      expect(t(key, { device: 'computer' })).toContain(camera)
      expect(t(key, { device: 'computer' })).not.toContain(phone)
      expect(t(key, { device: 'mobile' })).toContain(phone)
    }
  },
)
