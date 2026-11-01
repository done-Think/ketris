import { describe, expect, it } from 'vitest'
import { faceFramingStatus } from '../utils/face-framing'
import type { FaceFrameBounds, FaceGuideGeometry } from '../types/face-framing.types'

const viewport: FaceGuideGeometry = {
  width: 560,
  height: 420,
  guide: { x: 162, y: 54, width: 236, height: 312 },
}

// Coordinates originate in a 16:9 sensor, displayed in a 4:3 mirrored cover viewport.
function reading(face: FaceFrameBounds | null, faceCount = face ? 1 : 0) {
  return { width: 640, height: 360, faceCount, face }
}

describe('selfie framing matches the visible oval', () => {
  it('compensates cover cropping and mirroring instead of treating the whole sensor as visible', () => {
    expect(
      faceFramingStatus(reading({ x: 0.36, y: 0.2, width: 0.28, height: 0.6 }), viewport),
    ).toBe('ready')
    // The visible cover-scaled face is 149px wide, not the 112px of an uncropped fit.
    expect(faceFramingStatus(reading({ x: 0.4, y: 0.2, width: 0.2, height: 0.6 }), viewport)).toBe(
      'ready',
    )
    expect(faceFramingStatus(reading({ x: 0.1, y: 0.2, width: 0.28, height: 0.6 }), viewport)).toBe(
      'offCenter',
    )
  })

  it.each([
    [{ x: 0.46, y: 0.45, width: 0.08, height: 0.1 }, 'tooFar'],
    [{ x: 0.1, y: 0.05, width: 0.8, height: 0.9 }, 'tooClose'],
    [{ x: 0.36, y: 0.01, width: 0.28, height: 0.5 }, 'offCenter'],
  ] as const)('distinguishes face size and position (%s)', (face, expected) => {
    expect(faceFramingStatus(reading(face), viewport)).toBe(expected)
  })

  it('does not show a green guide without exactly one usable face', () => {
    expect(faceFramingStatus(reading(null), viewport)).toBe('notFound')
    expect(
      faceFramingStatus(reading({ x: 0.36, y: 0.2, width: 0.28, height: 0.6 }, 2), viewport),
    ).toBe('multipleFaces')
    expect(faceFramingStatus(reading({ x: NaN, y: 0.2, width: 0.28, height: 0.6 }), viewport)).toBe(
      'unavailable',
    )
    expect(faceFramingStatus({ ...reading(null), width: 0 }, viewport)).toBe('unavailable')
  })

  it('works with a portrait sensor and a mobile oval', () => {
    const mobile = { width: 384, height: 480, guide: { x: 74, y: 84, width: 236, height: 312 } }
    expect(
      faceFramingStatus(
        {
          width: 360,
          height: 640,
          faceCount: 1,
          face: { x: 0.25, y: 0.31, width: 0.5, height: 0.38 },
        },
        mobile,
      ),
    ).toBe('ready')
  })
})
