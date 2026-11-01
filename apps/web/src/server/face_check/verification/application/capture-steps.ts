import type {
  CaptureEvidence,
  CaptureEvidenceStatus,
  CaptureEvidenceStep,
  DocumentSide,
  EvidenceDiagnostics,
  EvidenceKind,
  LivenessChallenge,
  LivenessIssue,
} from '@server/face_check/types/session.types'

import { buildDocumentCheck } from '../../face-match/document-check'
import { isSamePhoto, sha256Hex } from '../../face-match/photo-fingerprint'
import type {
  CapturedImage,
  DocumentReadingSummary,
  LivenessFrame,
} from '../../types/face-match.types'
import type {
  ActivePhoto,
  SessionRecord,
  VerificationDependencies,
} from '../../types/verification.types'
import {
  addAlerts,
  documentRejectionsBeforeContinuation,
  ensureInProgress,
  evidenceOrder,
  iso,
  livenessPool,
  registerRejection,
  syncEvidence,
} from '../domain/session-rules'
import { analysisFailure, VerificationError } from '../domain/verification-error'

export async function beginEvidence(
  deps: VerificationDependencies,
  record: SessionRecord,
  step: CaptureEvidenceStep,
  image: CapturedImage,
  challenge: LivenessChallenge | null = null,
): Promise<CaptureEvidence> {
  const evidence: CaptureEvidence = {
    id: deps.newId(),
    step,
    challenge,
    attempt: record.session.captureAttempt ?? record.session.attemptsUsed + 1,
    capturedAt: iso(deps.clock()),
    status: 'pending',
    reason: null,
  }
  record.session.evidenceHistory.push(evidence)
  record.session.updatedAt = evidence.capturedAt
  try {
    await deps.photos.save(record.session.id, evidence.id, image)
    evidence.stored = true
  } catch (error) {
    evidence.stored = false
    evidence.status = 'unavailable'
    throw error
  }

  return evidence
}

export function finishEvidence(
  deps: VerificationDependencies,
  record: SessionRecord,
  evidence: CaptureEvidence,
  status: CaptureEvidenceStatus,
) {
  const stored = record.session.evidenceHistory.find((item) => item.id === evidence.id)
  if (stored) stored.status = status
  record.session.updatedAt = iso(deps.clock())
}

export function failEvidence(
  deps: VerificationDependencies,
  record: SessionRecord,
  evidence: CaptureEvidence,
  error: unknown,
) {
  finishEvidence(
    deps,
    record,
    evidence,
    error instanceof VerificationError && ['PHOTO_REJECTED', 'LIVENESS_FAILED'].includes(error.code)
      ? 'rejected'
      : 'unavailable',
  )
  const stored = record.session.evidenceHistory.find((item) => item.id === evidence.id)
  if (stored) stored.reason = error instanceof VerificationError ? error.reason : null
}

function updateDocumentReading(
  record: SessionRecord,
  side: DocumentSide,
  reading: DocumentReadingSummary | null,
) {
  const readings = { ...record.capture.documentReadings }
  if (reading) readings[side] = reading
  else delete readings[side]
  record.capture.documentReadings = readings
  record.session.documentCheck = buildDocumentCheck(
    [readings.front, readings.back],
    record.session.documentType,
  )
}

function repeatsAnotherPhoto(record: SessionRecord, kind: EvidenceKind, photo: ActivePhoto) {
  return evidenceOrder.some((other) => {
    const existing = record.capture.photos[other]

    return other !== kind && existing !== undefined && isSamePhoto(photo, existing)
  })
}

export function recordDiagnostics(
  record: SessionRecord,
  evidence: CaptureEvidence,
  diagnostics: EvidenceDiagnostics | null,
) {
  const stored = record.session.evidenceHistory.find((item) => item.id === evidence.id)
  if (stored && diagnostics) stored.diagnostics = diagnostics
}

export function recordLiveScore(record: SessionRecord, score: number | null) {
  if (score === null) return
  const current = record.capture.liveScore
  record.capture.liveScore = current === null ? score : Math.min(current, score)
}

async function inspectPhoto(
  deps: VerificationDependencies,
  record: SessionRecord,
  kind: EvidenceKind,
  image: CapturedImage,
) {
  if (!deps.faceEngine) throw new VerificationError('ANALYSIS_UNAVAILABLE')
  try {
    return await deps.faceEngine.inspect(kind, image.bytes, {
      name: record.session.personName,
      cpf: record.session.cpf,
    })
  } catch (error) {
    throw analysisFailure(error)
  }
}

export async function acceptPhoto(
  deps: VerificationDependencies,
  record: SessionRecord,
  kind: EvidenceKind,
  image: CapturedImage,
) {
  const { session } = record
  ensureInProgress(session)
  const evidence = await beginEvidence(deps, record, kind, image)
  try {
    if (kind === 'back' && !record.capture.photos.front)
      throw new VerificationError('INVALID_CAPTURE_STATE')
    if (kind !== 'selfie' && record.capture.photos.selfie)
      throw new VerificationError('INVALID_CAPTURE_STATE')
    if (kind === 'selfie' && (!record.capture.photos.front || !record.capture.photos.back))
      throw new VerificationError('INVALID_CAPTURE_STATE')
    if (
      record.session.evidenceHistory.filter(
        (item) => item.step === kind && item.attempt === session.attemptsUsed + 1,
      ).length > 8
    ) {
      session.status = 'REVIEW'
      session.reviewReason = 'tooManyRejections'
      throw new VerificationError('NO_ATTEMPTS_LEFT')
    }
    if (kind === 'front') {
      delete record.capture.photos.back
      delete record.capture.documentReadings.back
      syncEvidence(record)
    }
    const inspection = await inspectPhoto(deps, record, kind, image)
    recordDiagnostics(record, evidence, inspection.diagnostics ?? null)
    ensureInProgress(session)
    if (kind !== 'selfie') updateDocumentReading(record, kind, inspection.document)
    const photo: ActivePhoto = {
      evidenceId: evidence.id,
      sha256: sha256Hex(image.bytes),
      hashes: inspection.hashes,
      liveScore: inspection.liveScore,
      document: inspection.document,
    }
    const documentIssue =
      kind !== 'selfie' && inspection.document?.cardDetected === false
        ? 'documentShapeNotFound'
        : null
    const issue =
      inspection.issues[0] ??
      documentIssue ??
      (repeatsAnotherPhoto(record, kind, photo) ? 'duplicatePhoto' : null)
    if (issue) {
      const previousRejections = session.evidenceHistory.filter(
        (item) =>
          item.step === kind &&
          item.attempt === session.attemptsUsed + 1 &&
          item.status === 'rejected',
      ).length
      if (kind !== 'selfie' && previousRejections + 1 >= documentRejectionsBeforeContinuation) {
        failEvidence(deps, record, evidence, new VerificationError('PHOTO_REJECTED', issue))
        record.capture.photos = { ...record.capture.photos, [kind]: photo }
        syncEvidence(record)
        addAlerts(session, ['documentManualReview'])
        return
      }
      registerRejection(record, kind, deps.clock(), deps.newId())
      throw new VerificationError('PHOTO_REJECTED', issue)
    }
    if (kind !== 'selfie' && !inspection.document)
      throw new VerificationError('ANALYSIS_UNAVAILABLE')
    if (kind === 'selfie') {
      record.capture.livenessVerified = false
      record.capture.liveScore = null
      recordLiveScore(record, inspection.liveScore)
    }
    record.capture.photos = { ...record.capture.photos, [kind]: photo }
    syncEvidence(record)
    finishEvidence(deps, record, evidence, 'accepted')
  } catch (error) {
    if (
      kind !== 'selfie' &&
      error instanceof VerificationError &&
      error.code.startsWith('ANALYSIS_')
    )
      updateDocumentReading(record, kind, null)
    failEvidence(deps, record, evidence, error)
    throw error
  }
}

export function issueChallenges(deps: VerificationDependencies, record: SessionRecord) {
  const order = [...livenessPool]
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(deps.random() * (index + 1))
    ;[order[index], order[swap]] = [order[swap], order[index]]
  }
  const issued = { challenges: order, step: 0, checkpointAt: deps.clock() }
  record.capture.challenges = issued

  return issued
}

export function rejectLiveness(
  deps: VerificationDependencies,
  record: SessionRecord,
  issue: LivenessIssue,
): never {
  record.capture.challenges = null
  registerRejection(record, 'liveness', deps.clock(), deps.newId())
  throw new VerificationError('LIVENESS_FAILED', issue)
}

export async function checkLiveness(
  deps: VerificationDependencies,
  selfie: Uint8Array,
  frames: LivenessFrame[],
) {
  if (!deps.faceEngine) throw new VerificationError('ANALYSIS_UNAVAILABLE')
  try {
    return await deps.faceEngine.verifyLiveness(selfie, frames)
  } catch (error) {
    throw analysisFailure(error)
  }
}
