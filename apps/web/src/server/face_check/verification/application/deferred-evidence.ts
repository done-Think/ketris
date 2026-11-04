import type { EvidenceKind, LivenessChallenge } from '../../types/session.types'
import type { CapturedImage } from '../../types/face-match.types'
import type { SessionRecord, VerificationDependencies } from '../../types/verification.types'
import { sha256Hex } from '../../face-match/photo-fingerprint'
import { ensureInProgress, syncEvidence } from '../domain/session-rules'
import { VerificationError } from '../domain/verification-error'
import { beginEvidence } from './capture-steps'

export async function receivePhoto(
  deps: VerificationDependencies,
  record: SessionRecord,
  kind: EvidenceKind,
  image: CapturedImage,
) {
  ensureInProgress(record.session)
  const fingerprint = sha256Hex(image.bytes)
  // A lost acknowledgement can be retried without creating another stored object.
  if (record.capture.photos[kind]?.sha256 === fingerprint) return
  if (
    (kind === 'back' && !record.capture.photos.front) ||
    (kind !== 'selfie' && record.capture.photos.selfie) ||
    (kind === 'selfie' && (!record.capture.photos.front || !record.capture.photos.back))
  )
    throw new VerificationError('INVALID_CAPTURE_STATE')
  if (
    record.session.evidenceHistory.filter(
      (item) => item.step === kind && item.attempt === record.session.captureAttempt,
    ).length >= 8
  )
    throw new VerificationError('NO_ATTEMPTS_LEFT')
  const evidence = await beginEvidence(deps, record, kind, image)
  record.capture.photos[kind] = {
    evidenceId: evidence.id,
    sha256: fingerprint,
    hashes: [],
    liveScore: null,
    document: null,
  }
  syncEvidence(record)
}

export async function receiveMovement(
  deps: VerificationDependencies,
  record: SessionRecord,
  challenge: LivenessChallenge,
  image: CapturedImage,
) {
  const deferred = record.capture.deferred!
  const issued = record.capture.challenges
  const fingerprint = sha256Hex(image.bytes)
  const previous = deferred.movements[challenge]
  if (!issued || !record.capture.photos.selfie) throw new VerificationError('INVALID_CAPTURE_STATE')
  if (previous?.sha256 === fingerprint) return { remaining: issued.challenges.length - issued.step }
  if (previous || issued.challenges[issued.step] !== challenge)
    throw new VerificationError('LIVENESS_FAILED', 'livenessOutOfOrder')
  const evidence = await beginEvidence(deps, record, 'liveness', image, challenge)
  deferred.movements[challenge] = { evidenceId: evidence.id, sha256: fingerprint }
  issued.step += 1
  issued.checkpointAt = deps.clock()
  return { remaining: issued.challenges.length - issued.step }
}
