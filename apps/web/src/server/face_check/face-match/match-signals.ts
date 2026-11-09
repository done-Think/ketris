import type {
  ReviewReason,
  SessionAlert,
  SessionSignal,
} from '@server/face_check/types/session.types'

import type { FaceMatchResult } from '../types/face-match.types'

const selfieInterocularMinimumPx = 90
const interocularScaleMaxPx = 200
const nearIdenticalSimilarity = 0.85
const spoofAlertBelow = 0.5

function roundScore(value: number) {
  return Math.round(Math.max(0, value) * 1000) / 1000
}

export function buildMatchSignals(result: FaceMatchResult): SessionSignal[] {
  const signals: SessionSignal[] = []
  if (result.similarity !== null) {
    signals.push({
      key: 'faceMatch',
      value: result.similarity,
      threshold: null,
      max: 1,
      unit: 'score',
    })
  }
  if (result.selfie.interocularPx !== null) {
    signals.push({
      key: 'interocularDistance',
      value: Math.round(result.selfie.interocularPx),
      threshold: selfieInterocularMinimumPx,
      max: interocularScaleMaxPx,
      unit: 'px',
    })
  }
  if (result.document.interocularPx !== null) {
    signals.push({
      key: 'documentInterocularDistance',
      value: Math.round(result.document.interocularPx),
      threshold: null,
      max: interocularScaleMaxPx,
      unit: 'px',
    })
  }

  return signals
}

export function reviewReasonFor(result: FaceMatchResult): ReviewReason {
  return result.similarity === null ? 'faceNotFound' : 'experimentalMatch'
}

export function livenessSignal(liveScore: number): SessionSignal {
  return {
    key: 'passiveLiveness',
    value: roundScore(liveScore),
    threshold: null,
    max: 1,
    unit: 'score',
  }
}

export function livenessAlertsFor(liveScore: number): SessionAlert[] {
  return liveScore < spoofAlertBelow ? ['possibleSpoof'] : []
}

export function matchAlertsFor(result: FaceMatchResult): SessionAlert[] {
  return result.similarity !== null && result.similarity >= nearIdenticalSimilarity
    ? ['nearIdenticalFaces']
    : []
}
