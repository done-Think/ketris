import { similarityPolicy } from '@server/face_check/config/similarity-policy'

import type { SimilarityDecision, SimilarityDecisionInput } from '../types/face-match.types'

export function decideSimilarity({
  similarity,
  attempt,
  maxAttempts,
  checksPassed,
  autoApproval,
}: SimilarityDecisionInput): SimilarityDecision {
  if (similarity === null || !Number.isFinite(similarity) || similarity < -1 || similarity > 1)
    return { status: 'REVIEW', reviewReason: 'faceNotFound', redoReason: null, alerts: [] }
  if (!checksPassed)
    return {
      status: 'REVIEW',
      reviewReason: 'verificationChecksFailed',
      redoReason: null,
      alerts: [],
    }
  if (similarity > similarityPolicy.approveAbove)
    return autoApproval
      ? { status: 'APPROVED', reviewReason: null, redoReason: null, alerts: [] }
      : { status: 'REVIEW', reviewReason: 'autoApprovalPaused', redoReason: null, alerts: [] }
  if (similarity > similarityPolicy.reviewAbove)
    return { status: 'REVIEW', reviewReason: 'experimentalMatch', redoReason: null, alerts: [] }
  if (attempt < similarityPolicy.lowScoreAttempts && attempt < maxAttempts)
    return {
      status: 'RESUBMISSION_REQUESTED',
      reviewReason: null,
      redoReason: 'lowSimilarity',
      alerts: [],
    }
  return {
    status: 'REVIEW',
    reviewReason:
      attempt >= similarityPolicy.lowScoreAttempts ? 'lowSimilarityRepeated' : 'attemptsExhausted',
    redoReason: null,
    alerts:
      attempt >= similarityPolicy.lowScoreAttempts ? ['lowSimilarityRepeated'] : ['lowSimilarity'],
  }
}
