import type { CaptureEvidence, LivenessDiagnostics, PhotoDiagnostics } from '../types'

import type { DiagnosticLimit, DiagnosticRow } from '../types/console.types'

function min(value: number | undefined): DiagnosticLimit | null {
  return value === undefined ? null : { kind: 'min', value }
}

function max(value: number | undefined): DiagnosticLimit | null {
  return value === undefined ? null : { kind: 'max', value }
}

function check(value: number, limit: DiagnosticLimit | null) {
  if (!limit) return null
  if (limit.kind === 'min') return value >= limit.value
  if (limit.kind === 'max') return value <= limit.value
  return value >= limit.min && value <= limit.max
}

function row(key: DiagnosticRow['key'], value: number | null, limit: DiagnosticLimit | null) {
  return value === null ? [] : [{ key, value, limit, passed: check(value, limit) }]
}

function photoRows(step: CaptureEvidence['step'], photo: PhotoDiagnostics): DiagnosticRow[] {
  const { limits } = photo
  const brightness: DiagnosticLimit | null =
    limits.minBrightness === undefined || limits.maxBrightness === undefined
      ? null
      : { kind: 'range', min: limits.minBrightness, max: limits.maxBrightness }
  const common = [
    ...row('resolution', Math.min(photo.width, photo.height), min(limits.minShortSidePx)),
    ...row(
      photo.brightnessSource === 'text' ? 'documentBrightness' : 'brightness',
      photo.brightness,
      brightness,
    ),
    ...row('sharpness', photo.sharpness, min(limits.minSharpness)),
  ]
  if (step === 'selfie')
    return [
      ...common,
      ...row('faceSize', photo.largestFaceRatio, min(limits.minFaceRatio)),
      ...row('eyeDistance', photo.largestFaceInterocularPx, min(limits.minInterocularPx)),
      ...row('textRegions', photo.textRegions, max((limits.maxTextRegions ?? 0) - 1)),
      ...row('realProbability', photo.realProbability, min(limits.minRealProbability)),
    ]

  return [
    ...common,
    ...row('textRegions', photo.textRegions, min(limits.minTextRegions)),
    ...(step === 'front' ? row('documentFace', photo.facesFound, min(1)) : []),
    ...row('faceSize', photo.largestFaceRatio, max(limits.maxFaceRatio)),
  ]
}

function livenessRows(
  challenge: CaptureEvidence['challenge'],
  liveness: LivenessDiagnostics,
): DiagnosticRow[] {
  const { limits } = liveness

  return [
    ...(challenge === 'closer'
      ? row('closer', liveness.closerRatio, min(limits.minCloserRatio))
      : row('turn', liveness.yawDelta, min(limits.minTurnDelta))),
    ...row('samePerson', liveness.similarity, min(limits.minSamePersonSimilarity)),
    ...row('realProbability', liveness.realProbability, min(limits.minRealProbability)),
  ]
}

export function diagnosticRows(evidence: CaptureEvidence): DiagnosticRow[] {
  const diagnostics = evidence.diagnostics
  if (!diagnostics) return []

  return diagnostics.kind === 'photo'
    ? photoRows(evidence.step, diagnostics)
    : livenessRows(evidence.challenge, diagnostics)
}
