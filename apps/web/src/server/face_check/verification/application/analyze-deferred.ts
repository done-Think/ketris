import type { EvidenceKind } from '../../types/session.types'
import type { SessionRecord, VerificationDependencies } from '../../types/verification.types'
import { evidenceOrder, iso, livenessPool, pushEvent, addAlerts } from '../domain/session-rules'
import {
  checkLiveness,
  failEvidence,
  finishEvidence,
  inspectPhoto,
  recordDiagnostics,
  recordLiveScore,
  repeatsAnotherPhoto,
  updateDocumentReading,
} from './capture-steps'
import { VerificationError } from '../domain/verification-error'
import { ensureEvidenceAvailable } from '../domain/evidence-policy'

export function hasPendingInspections(record: SessionRecord) {
  const deferred = record.capture.deferred
  return (
    !!deferred &&
    (deferred.inspected.length < evidenceOrder.length ||
      deferred.checkedMovements < livenessPool.length)
  )
}

// Each stage commits independently. A timeout/crash can resume using the stored images.
export async function analyzeDeferredStage(deps: VerificationDependencies, record: SessionRecord) {
  const deferred = record.capture.deferred!
  ensureEvidenceAvailable(record.session, deps.clock())
  const kind = evidenceOrder.find((item) => !deferred.inspected.includes(item))
  if (kind) {
    await inspectStoredPhoto(deps, record, kind)
    deferred.inspected.push(kind)
  } else {
    const challenge = livenessPool[deferred.checkedMovements]
    const evidenceId = deferred.movements[challenge]?.evidenceId
    const evidence = record.session.evidenceHistory.find((item) => item.id === evidenceId)
    if (!evidence) throw new VerificationError('IMAGE_REQUIRED')
    try {
      const selfie = record.capture.photos.selfie
      const reference = selfie ? await deps.photos.load(record.session.id, selfie.evidenceId) : null
      const image = await deps.photos.load(record.session.id, evidence.id)
      if (!reference || !image) throw new VerificationError('EVIDENCE_DELETED')
      const result = await checkLiveness(deps, reference.bytes, [{ challenge, image: image.bytes }])
      recordDiagnostics(record, evidence, result.diagnostics ?? null)
      recordLiveScore(record, result.liveScore)
      finishEvidence(deps, record, evidence, result.passed ? 'accepted' : 'rejected')
      evidence.reason = result.passed ? null : (result.issues[0] ?? 'livenessNotTurned')
    } catch (error) {
      failEvidence(deps, record, evidence, error)
    }
    deferred.checkedMovements += 1
    if (deferred.checkedMovements === livenessPool.length) {
      record.capture.livenessVerified = livenessPool.every((pose) =>
        record.session.evidenceHistory.some(
          (item) => item.id === deferred.movements[pose]?.evidenceId && item.status === 'accepted',
        ),
      )
      if (record.capture.livenessVerified)
        pushEvent(record.session, deps.newId(), 'livenessVerified', 'system', deps.clock())
    }
  }
  record.session.updatedAt = iso(deps.clock())
}

async function inspectStoredPhoto(
  deps: VerificationDependencies,
  record: SessionRecord,
  kind: EvidenceKind,
) {
  const photo = record.capture.photos[kind]
  const evidence = record.session.evidenceHistory.find((item) => item.id === photo?.evidenceId)
  if (!photo || !evidence) throw new VerificationError('IMAGE_REQUIRED')
  try {
    const image = await deps.photos.load(record.session.id, evidence.id)
    if (!image) throw new VerificationError('EVIDENCE_DELETED')
    const result = await inspectPhoto(deps, record, kind, image)
    recordDiagnostics(record, evidence, result.diagnostics ?? null)
    photo.hashes = result.hashes
    photo.liveScore = result.liveScore
    photo.document = result.document
    if (kind !== 'selfie') updateDocumentReading(record, kind, result.document)
    else recordLiveScore(record, result.liveScore)
    const issue =
      result.issues[0] ??
      (kind !== 'selfie' && result.document?.cardDetected === false
        ? 'documentShapeNotFound'
        : null) ??
      (repeatsAnotherPhoto(record, kind, photo) ? 'duplicatePhoto' : null)
    if (issue) {
      evidence.reason = issue
      finishEvidence(deps, record, evidence, 'rejected')
    } else if (kind !== 'selfie' && !result.document) {
      throw new VerificationError('ANALYSIS_UNAVAILABLE')
    } else finishEvidence(deps, record, evidence, 'accepted')
  } catch (error) {
    failEvidence(deps, record, evidence, error)
    if (kind !== 'selfie') updateDocumentReading(record, kind, null)
  }
  if (kind !== 'selfie' && evidence.status !== 'accepted')
    addAlerts(record.session, ['documentManualReview'])
}
