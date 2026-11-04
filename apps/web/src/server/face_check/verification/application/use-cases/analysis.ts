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
import { analyzeDeferredStage, hasPendingInspections } from '../analyze-deferred'
import { evidenceUnavailable } from '../../domain/evidence-policy'

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
  // The engine supplies evidence to the reviewer; only a person may request another capture.
  if (session.status === 'RESUBMISSION_REQUESTED') {
    session.status = 'REVIEW'
    session.reviewReason = 'verificationChecksFailed'
    session.redoReason = null
    addAlerts(session, ['lowSimilarity'])
  }
  const activeEvidence = new Set([
    ...Object.values(record.capture.photos).map((photo) => photo.evidenceId),
    ...Object.values(record.capture.deferred?.movements ?? {}).map((photo) => photo.evidenceId),
  ])
  if (
    record.capture.deferred &&
    (!record.capture.livenessVerified ||
      session.evidenceHistory.some(
        (item) => activeEvidence.has(item.id) && item.status !== 'accepted',
      ))
  ) {
    session.status = 'REVIEW'
    if (!documentNeedsReview) session.reviewReason = 'verificationChecksFailed'
  }
}

export function analyzeSessionUseCase(deps: VerificationDependencies) {
  return {
    execute: async (sessionId: string, budgetMs = 90_000) => {
      const startedAt = Date.now()
      // Checkpoints make PROCESSING a durable queue. Never hold a lease across the whole pipeline.
      while (true) {
        const pending = await deps.sessions.read({ id: sessionId })
        if (!pending || pending.session.status !== 'PROCESSING') return
        try {
          await deps.sessions.update({ id: sessionId }, async (record) => {
            const { session } = record
            if (session.status !== 'PROCESSING') return
            if (evidenceUnavailable(session, deps.clock())) {
              session.status = 'REVIEW'
              session.reviewReason = 'evidenceExpired'
              return
            }
            if (hasPendingInspections(record)) {
              await analyzeDeferredStage(deps, record)
              return
            }
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
        } catch (error) {
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'PERSISTENCE_BUSY'
          )
            return
          throw error
        }
        // Reserve enough time for a full 60-second engine call plus storage and persistence.
        if (Date.now() - startedAt > budgetMs - 65_000) return
      }
    },
  }
}
