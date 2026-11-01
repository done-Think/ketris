import { similarityPolicy } from '@server/face_check/config/similarity-policy'
import type { SimilarityAttempt } from '@server/face_check/types/session.types'

import {
  buildMatchSignals,
  livenessAlertsFor,
  livenessSignal,
  matchAlertsFor,
} from '../../../face-match/match-signals'
import { decideSimilarity } from '../../../face-match/similarity-policy'
import { verificationChecksPassed } from '../../../face-match/verification-checks'
import { documentAlertsFor } from '../../../face-match/document-check'
import type { FaceMatchResult } from '../../../types/face-match.types'
import type { SessionRecord, VerificationDependencies } from '../../../types/verification.types'
import { addAlerts, clearCapture, iso, pushEvent, renewLink } from '../../domain/session-rules'

async function matchPhotos(deps: VerificationDependencies, record: SessionRecord) {
  const { front, selfie } = record.capture.photos
  if (!deps.faceEngine || !front || !selfie) return null
  try {
    const [document, face] = await Promise.all([
      deps.photos.load(record.session.id, front.evidenceId),
      deps.photos.load(record.session.id, selfie.evidenceId),
    ])
    if (!document || !face) return null
    const result = await deps.faceEngine.match(document.bytes, face.bytes)
    if (
      result.similarity !== null &&
      (!Number.isFinite(result.similarity) || result.similarity < -1 || result.similarity > 1)
    )
      return null

    return result
  } catch {
    return null
  }
}

function applyMatch(record: SessionRecord, result: FaceMatchResult) {
  const { session } = record
  const liveScore = record.capture.liveScore
  session.signals = [
    ...buildMatchSignals(result),
    ...(liveScore === null ? [] : [livenessSignal(liveScore)]),
  ]
  addAlerts(session, [
    ...documentAlertsFor(session.documentCheck),
    ...matchAlertsFor(result),
    ...(liveScore === null ? [] : livenessAlertsFor(liveScore)),
  ])
  const checksPassed = verificationChecksPassed({
    check: session.documentCheck,
    expectsCpf: !!session.cpf,
    match: result,
    alerts: session.alerts,
  })
  const decision = decideSimilarity({
    similarity: result.similarity,
    attempt: session.attemptsUsed,
    maxAttempts: session.maxAttempts,
    checksPassed,
    autoApproval: similarityPolicy.autoApproval,
  })
  const documentNeedsReview = session.alerts.includes('documentManualReview')
  session.status = documentNeedsReview ? 'REVIEW' : decision.status
  session.reviewReason = documentNeedsReview ? 'documentManualReview' : decision.reviewReason
  session.redoReason = documentNeedsReview ? null : decision.redoReason
  addAlerts(session, decision.alerts)
}

export function analyzeSessionUseCase(deps: VerificationDependencies) {
  return {
    execute: async (sessionId: string) => {
      const pending = await deps.sessions.read({ id: sessionId })
      if (!pending || pending.session.status !== 'PROCESSING') return
      await deps.sessions.update({ id: sessionId }, async (record) => {
        const { session } = record
        if (session.status !== 'PROCESSING') return
        const result = await matchPhotos(deps, record)
        if (result) {
          applyMatch(record, result)
        } else {
          session.signals = []
          session.status = 'REVIEW'
          session.reviewReason = 'analysisUnavailable'
        }
        const now = deps.clock()
        const status = session.status as SimilarityAttempt['status']
        session.similarityAttempts.push({
          attempt: session.attemptsUsed,
          similarity: result?.similarity ?? null,
          analyzedAt: iso(now),
          status,
        })
        if (status === 'APPROVED') session.decidedAt = iso(now)
        if (status === 'RESUBMISSION_REQUESTED') renewLink(session, now)
        pushEvent(
          session,
          deps.newId(),
          status === 'APPROVED'
            ? 'autoApproved'
            : status === 'RESUBMISSION_REQUESTED'
              ? 'autoRedo'
              : 'autoReview',
          'system',
          now,
        )
        if (status !== 'REVIEW') clearCapture(record)
      })
    },
  }
}
