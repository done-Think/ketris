import { consentTermsVersion } from '@server/face_check/config/consent-terms'
import type {
  AlternativeRequestInput,
  CaptureSessionView,
  CaptureStatusView,
  ConsentInput,
  DocumentSide,
  DocumentType,
  LivenessChallenge,
} from '@server/face_check/types/session.types'

import type { CapturedImage, LivenessProgress } from '../../../types/face-match.types'
import type { SessionRecord, VerificationDependencies } from '../../../types/verification.types'
import {
  captureWindowMs,
  clearCapture,
  ensureAcceptedDocument,
  ensureCapturable,
  ensureInProgress,
  iso,
  livenessStepWindowMs,
  pushEvent,
  toCaptureView,
  toStatusView,
} from '../../domain/session-rules'
import { VerificationError } from '../../domain/verification-error'
import {
  acceptPhoto,
  beginEvidence,
  checkLiveness,
  failEvidence,
  finishEvidence,
  issueChallenges,
  recordLiveScore,
  recordDiagnostics,
  rejectLiveness,
} from '../capture-steps'
import { changeSession } from '../session-access'
import { requireCapturePlan } from '../capture-plan'
import type { analyzeSessionUseCase } from './analysis'

async function captureView(deps: VerificationDependencies, record: SessionRecord) {
  const settings = await deps.settings.get()

  return toCaptureView(record.session, settings.allowGalleryUpload)
}

function recordDocument(
  deps: VerificationDependencies,
  record: SessionRecord,
  side: DocumentSide,
  type: DocumentType,
) {
  record.session.documentType = type
  if (side === 'front')
    pushEvent(record.session, deps.newId(), 'documentSent', 'person', deps.clock())
}

export function getCaptureSessionUseCase(deps: VerificationDependencies) {
  return {
    execute: async (token: string): Promise<CaptureSessionView> => {
      const record = await changeSession(deps, { token }, (current) => current)

      return captureView(deps, record)
    },
  }
}

export function consentUseCase(deps: VerificationDependencies) {
  return {
    execute: async (token: string, input: ConsentInput): Promise<CaptureSessionView> => {
      const record = await changeSession(deps, { token }, (current) => {
        const { session } = current
        ensureCapturable(session)
        if (input.termsVersion !== consentTermsVersion[session.captureMode])
          throw new VerificationError('CONSENT_TERMS_OUTDATED')
        if (session.status === 'IN_PROGRESS') return current
        if (session.captureMode === 'camera' && !deps.faceEngine)
          throw new VerificationError('ANALYSIS_UNAVAILABLE')
        session.captureAttempt = session.attemptsUsed + 1
        session.submittedAt = null
        session.decidedAt = null
        session.alternativePath = false
        session.documentType = null
        current.capture.documentReadings = {}
        session.signals = []
        session.documentCheck = null
        session.reviewReason = null
        session.alerts = []
        const now = deps.clock()
        session.status = 'IN_PROGRESS'
        session.redoReason = null
        session.captureDeadline = iso(now + captureWindowMs)
        pushEvent(session, deps.newId(), 'consented', 'person', now, {
          consent: { termsVersion: input.termsVersion, agencyName: session.agencyName },
        })

        return current
      })

      return captureView(deps, record)
    },
  }
}

export function uploadDocumentPhotoUseCase(deps: VerificationDependencies) {
  return {
    execute: (
      token: string,
      side: DocumentSide,
      documentType: DocumentType,
      image: CapturedImage,
      planId?: string,
    ) =>
      changeSession(deps, { token }, async (current) => {
        ensureInProgress(current.session)
        requireCapturePlan(current, planId)
        if (current.session.captureMode !== 'camera')
          throw new VerificationError('INVALID_CAPTURE_STATE')
        ensureAcceptedDocument(current.session, side, documentType)
        current.session.documentType = documentType
        await acceptPhoto(deps, current, side, image)
        recordDocument(deps, current, side, documentType)
      }),
  }
}

export function getChallengesUseCase(deps: VerificationDependencies) {
  return {
    execute: (token: string): Promise<LivenessChallenge[]> =>
      changeSession(deps, { token }, (record) => {
        ensureInProgress(record.session)
        if (!record.capture.photos.selfie || record.capture.livenessVerified)
          throw new VerificationError('INVALID_CAPTURE_STATE')
        return (record.capture.challenges ?? issueChallenges(deps, record)).challenges
      }),
  }
}

export function uploadSelfieUseCase(deps: VerificationDependencies) {
  return {
    execute: (token: string, selfie: CapturedImage | null, planId?: string) =>
      changeSession(deps, { token }, async (record) => {
        requireCapturePlan(record, planId)
        if (record.session.captureMode !== 'camera')
          throw new VerificationError('INVALID_CAPTURE_STATE')
        if (!selfie) throw new VerificationError('IMAGE_REQUIRED')
        await acceptPhoto(deps, record, 'selfie', selfie)
        issueChallenges(deps, record)
        pushEvent(record.session, deps.newId(), 'selfieSent', 'person', deps.clock())
      }),
  }
}

export function verifyLivenessFrameUseCase(deps: VerificationDependencies) {
  return {
    execute: (
      token: string,
      challenge: LivenessChallenge,
      image: CapturedImage,
      planId?: string,
    ): Promise<LivenessProgress> =>
      changeSession(deps, { token }, async (record) => {
        const { session, capture } = record
        ensureInProgress(session)
        requireCapturePlan(record, planId)
        if (session.captureMode !== 'camera') throw new VerificationError('INVALID_CAPTURE_STATE')
        const evidence = await beginEvidence(deps, record, 'liveness', image, challenge)
        try {
          const selfie = capture.photos.selfie
          const selfieImage = selfie ? await deps.photos.load(session.id, selfie.evidenceId) : null
          if (!selfieImage) throw new VerificationError('IMAGE_REQUIRED')
          const issued = capture.challenges
          if (!issued || deps.clock() - issued.checkpointAt > livenessStepWindowMs)
            rejectLiveness(deps, record, 'livenessExpired')
          if (issued.challenges[issued.step] !== challenge)
            rejectLiveness(deps, record, 'livenessOutOfOrder')
          const result = await checkLiveness(deps, selfieImage.bytes, [
            { challenge, image: image.bytes },
          ])
          recordDiagnostics(record, evidence, result.diagnostics ?? null)
          ensureInProgress(session)
          if (!result.passed) rejectLiveness(deps, record, result.issues[0] ?? 'livenessNotTurned')
          finishEvidence(deps, record, evidence, 'accepted')
          recordLiveScore(record, result.liveScore)
          const next = { ...issued, step: issued.step + 1, checkpointAt: deps.clock() }
          if (next.step < next.challenges.length) {
            capture.challenges = next
            return { remaining: next.challenges.length - next.step }
          }
          capture.challenges = null
          capture.livenessVerified = true
          pushEvent(session, deps.newId(), 'livenessVerified', 'system', deps.clock())
          return { remaining: 0 }
        } catch (error) {
          failEvidence(deps, record, evidence, error)
          throw error
        }
      }),
  }
}

export function submitCaptureUseCase(
  deps: VerificationDependencies,
  analyzeSession: ReturnType<typeof analyzeSessionUseCase>,
) {
  return {
    execute: async (token: string, planId?: string): Promise<CaptureStatusView> => {
      const submitted = await changeSession(deps, { token }, (record) => {
        const { session, capture } = record
        ensureInProgress(session)
        requireCapturePlan(record, planId)
        if (session.captureMode === 'camera') {
          const photos = capture.photos
          if (!photos.front || !photos.back || !photos.selfie)
            throw new VerificationError('IMAGE_REQUIRED')
          if (!capture.livenessVerified)
            throw new VerificationError('LIVENESS_FAILED', 'livenessIncomplete')
          capture.livenessVerified = false
        }
        const now = deps.clock()
        session.attemptsUsed += 1
        session.status = 'SUBMITTED'
        session.submittedAt = iso(now)
        session.captureDeadline = null
        capture.plan = null
        pushEvent(session, deps.newId(), 'submitted', 'person', now)
        if (session.captureMode === 'camera') session.status = 'PROCESSING'

        return {
          id: session.id,
          camera: session.captureMode === 'camera',
          view: toStatusView(session, now),
        }
      })
      if (submitted.camera) await deps.analyses.start(() => analyzeSession.execute(submitted.id))

      return submitted.view
    },
  }
}

export function getCaptureStatusUseCase(deps: VerificationDependencies) {
  return {
    execute: async (token: string): Promise<CaptureStatusView> => {
      const record = await changeSession(deps, { token }, (current) => current)

      return toStatusView(record.session, deps.clock())
    },
  }
}

export function requestAlternativeUseCase(deps: VerificationDependencies) {
  return {
    execute: async (token: string, input: AlternativeRequestInput): Promise<CaptureSessionView> => {
      const record = await changeSession(deps, { token }, (current) => {
        const { session } = current
        ensureCapturable(session)
        clearCapture(current)
        session.status = 'REVIEW'
        session.alternativePath = true
        session.reviewReason = 'alternativePath'
        session.contact = input.contact.trim() || session.contact
        session.captureDeadline = null
        pushEvent(session, deps.newId(), 'alternativeRequested', 'person', deps.clock(), {
          ...(input.reason ? { reason: input.reason } : {}),
        })

        return current
      })

      return captureView(deps, record)
    },
  }
}
