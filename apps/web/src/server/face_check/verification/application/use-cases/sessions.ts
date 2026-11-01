import type {
  CreateSessionInput,
  DecisionInput,
  SessionFilter,
  SessionListQuery,
  SessionListResult,
  VerificationSession,
} from '@server/face_check/types/session.types'
import { cpfDigits } from '@server/face_check/utils/cpf'

import type { CapturedImage } from '../../../types/face-match.types'
import type { VerificationDependencies } from '../../../types/verification.types'
import {
  clearCapture,
  hourMs,
  iso,
  matchesFilter,
  newSessionRecord,
  pushEvent,
  renewLink,
  sessionFilterStatuses,
} from '../../domain/session-rules'
import { VerificationError } from '../../domain/verification-error'
import { ensureEvidenceAvailable, manualOverrideAllowed } from '../../domain/evidence-policy'
import { changeSession, currentSessions, readSession } from '../session-access'

export function listSessionsUseCase(deps: VerificationDependencies) {
  return {
    execute: async (query: SessionListQuery): Promise<SessionListResult> => {
      const sessions = (await currentSessions(deps)).map((record) => record.session)
      const search = query.search.trim().toLowerCase()
      const searched = sessions.filter(
        (session) =>
          !search ||
          session.personName.toLowerCase().includes(search) ||
          (session.reference ?? '').toLowerCase().includes(search),
      )
      const filtered = searched
        .filter((session) => matchesFilter(session, query.filter))
        .sort((a, b) =>
          query.filter === 'review'
            ? a.updatedAt.localeCompare(b.updatedAt)
            : b.createdAt.localeCompare(a.createdAt),
        )
      const start = query.page * query.pageSize
      const counts = Object.fromEntries(
        (Object.keys(sessionFilterStatuses) as SessionFilter[]).map((filter) => [
          filter,
          searched.filter((session) => matchesFilter(session, filter)).length,
        ]),
      ) as Record<SessionFilter, number>

      return {
        items: filtered.slice(start, start + query.pageSize),
        total: filtered.length,
        counts,
      }
    },
  }
}

export function getSessionUseCase(deps: VerificationDependencies) {
  return {
    execute: async (id: string): Promise<VerificationSession> =>
      (await changeSession(deps, { id }, (record) => record)).session,
  }
}

export function createSessionUseCase(deps: VerificationDependencies) {
  return {
    execute: async (input: CreateSessionInput): Promise<VerificationSession> => {
      const settings = await deps.settings.get()
      if (!settings.agencyName.trim()) throw new VerificationError('AGENCY_NAME_MISSING')
      const now = deps.clock()
      const record = newSessionRecord(
        {
          id: deps.newId(),
          personName: input.personName.trim(),
          agencyName: settings.agencyName,
          cpf: cpfDigits(input.cpf ?? '') || null,
          reference: input.reference.trim() || null,
          contact: input.contact.trim() || null,
          acceptedDocument: input.acceptedDocument,
          createdAt: now,
          expiresAt: now + input.expiresInHours * hourMs,
          outcome: 'approve',
          token: deps.newToken(),
          captureMode: 'camera',
          maxAttempts: settings.maxAttempts,
        },
        deps.newId(),
      )
      record.session.propertyId = input.propertyId
      record.session.purpose = input.purpose
      await deps.sessions.insert(record)

      return record.session
    },
  }
}

export function recordEvidenceViewUseCase(deps: VerificationDependencies) {
  return {
    execute: async (id: string): Promise<VerificationSession> =>
      (
        await changeSession(deps, { id }, (record) => {
          pushEvent(record.session, deps.newId(), 'evidenceViewed', 'operator', deps.clock())
          return record
        })
      ).session,
  }
}

export function getEvidenceUseCase(deps: VerificationDependencies) {
  return {
    execute: async (id: string, reference: string): Promise<CapturedImage> => {
      const { session } = await readSession(deps, { id })
      ensureEvidenceAvailable(session, deps.clock())
      if (
        !session.timeline.some(
          (event) => event.kind === 'evidenceViewed' && event.actor === deps.actorId,
        )
      )
        throw new VerificationError('EVIDENCE_NOT_REVEALED')
      const metadata =
        session.evidenceHistory.find((item) => item.id === reference) ??
        session.evidenceHistory.findLast(
          (item) => item.step === reference && item.status === 'accepted',
        )
      const image = metadata ? await deps.photos.load(id, metadata.id) : null
      if (!image) throw new VerificationError('EVIDENCE_NOT_FOUND')

      return image
    },
  }
}

function reviewerViewedEvidence(session: VerificationSession, deps: VerificationDependencies) {
  return session.timeline.some(
    (event) =>
      event.kind === 'evidenceViewed' &&
      event.actor === deps.actorId &&
      event.at >=
        (session.timeline.findLast((item) => item.kind === 'consented')?.at ?? session.createdAt),
  )
}

function biometricChecksComplete(session: VerificationSession, deps: VerificationDependencies) {
  const check = session.documentCheck
  return (
    !session.alternativePath &&
    session.reviewReason === 'autoApprovalPaused' &&
    check?.cardDetected === true &&
    check.documentTypeMatches === true &&
    check.nameFound === true &&
    (session.cpf ? check.cpfMatches === true : check.cpfMatches !== false) &&
    !session.alerts.some((alert) =>
      [
        'possibleSpoof',
        'nearIdenticalFaces',
        'documentManualReview',
        'cpfMismatch',
        'documentTypeMismatch',
      ].includes(alert),
    ) &&
    session.signals.some((signal) => signal.key === 'faceMatch' && Number.isFinite(signal.value)) &&
    ['front', 'back', 'selfie'].every((step) =>
      session.evidenceHistory.some(
        (evidence) =>
          evidence.step === step &&
          evidence.attempt === (session.captureAttempt ?? session.attemptsUsed) &&
          evidence.status === 'accepted' &&
          !evidence.deletedAt,
      ),
    ) &&
    session.timeline.some(
      (event) =>
        event.kind === 'livenessVerified' &&
        event.at >=
          (session.timeline.findLast((item) => item.kind === 'consented')?.at ?? session.createdAt),
    ) &&
    reviewerViewedEvidence(session, deps)
  )
}

async function ensureReviewImagesPresent(
  session: VerificationSession,
  deps: VerificationDependencies,
) {
  const attempt =
    session.captureAttempt ??
    (session.submittedAt ? session.attemptsUsed : session.attemptsUsed + 1)
  const metadata = ['front', 'back', 'selfie'].map((step) =>
    session.evidenceHistory.findLast(
      (evidence) =>
        evidence.step === step &&
        evidence.attempt === attempt &&
        !evidence.deletedAt &&
        evidence.stored !== false,
    ),
  )
  if (metadata.some((evidence) => !evidence)) throw new VerificationError('VERIFICATION_INCOMPLETE')
  const images = await Promise.all(
    metadata.map((evidence) => deps.photos.load(session.id, evidence!.id)),
  )
  if (images.some((image) => !image)) throw new VerificationError('EVIDENCE_DELETED')
  ensureEvidenceAvailable(session, deps.clock())
}

export function decideSessionUseCase(deps: VerificationDependencies) {
  return {
    execute: async (id: string, input: DecisionInput): Promise<VerificationSession> => {
      const record = await changeSession(deps, { id }, async (current) => {
        const { session } = current
        if (session.captureMode !== 'camera') throw new VerificationError('INVALID_CAPTURE_STATE')
        if (session.status !== 'REVIEW') throw new VerificationError('SESSION_NOT_IN_REVIEW')
        if (
          input.manualOverride &&
          (input.decision !== 'approve' || !input.reason || input.note.trim().length < 10)
        )
          throw new VerificationError('MANUAL_OVERRIDE_INVALID')
        if (input.decision === 'approve') {
          ensureEvidenceAvailable(session, deps.clock())
          if (input.manualOverride) {
            if (
              !manualOverrideAllowed(session, deps.clock()) ||
              !reviewerViewedEvidence(session, deps)
            )
              throw new VerificationError('VERIFICATION_INCOMPLETE')
          } else if (!biometricChecksComplete(session, deps))
            throw new VerificationError('VERIFICATION_INCOMPLETE')
          await ensureReviewImagesPresent(session, deps)
        }
        const attempt =
          session.captureAttempt ??
          (session.submittedAt ? session.attemptsUsed : session.attemptsUsed + 1)
        if (
          session.evidenceHistory.some(
            (evidence) => evidence.attempt === attempt && !evidence.deletedAt,
          )
        )
          session.attemptsUsed = Math.max(session.attemptsUsed, attempt)
        const now = deps.clock()
        if (input.decision === 'redo') {
          if (session.attemptsUsed >= session.maxAttempts)
            throw new VerificationError('NO_ATTEMPTS_LEFT')
          session.status = 'RESUBMISSION_REQUESTED'
          session.redoReason = input.reason === 'liveness' ? 'selfieQuality' : 'documentIllegible'
          current.capture.rejections = {}
          session.token = deps.newToken()
          renewLink(session, now)
        } else {
          session.status = input.decision === 'approve' ? 'APPROVED' : 'REJECTED'
          session.decidedAt = iso(now)
          session.decisionMethod = 'MANUAL'
          session.manualOverride = input.manualOverride === true
          session.evidencePurgePending = true
        }
        clearCapture(current)
        pushEvent(session, deps.newId(), 'decision', 'operator', now, {
          decision: input.decision,
          decisionMethod: 'MANUAL',
          manualOverride: input.manualOverride === true,
          ...(input.reason ? { reason: input.reason } : {}),
          ...(input.note.trim() ? { note: input.note.trim() } : {}),
        })
        return current
      })
      if (
        (['APPROVED', 'REJECTED'].includes(record.session.status) ||
          record.session.evidencePurgePending) &&
        deps.purgeEvidence
      ) {
        await deps.purgeEvidence(id).catch(() => undefined)
        return (await readSession(deps, { id })).session
      }
      return record.session
    },
  }
}

export function reopenSessionUseCase(deps: VerificationDependencies) {
  return {
    execute: async (id: string): Promise<VerificationSession> => {
      const record = await changeSession(deps, { id }, (current) => {
        const { session } = current
        if (session.status !== 'REJECTED') throw new VerificationError('SESSION_NOT_REJECTED')
        if (session.attemptsUsed >= session.maxAttempts)
          throw new VerificationError('NO_ATTEMPTS_LEFT')
        const now = deps.clock()
        session.status = 'RESUBMISSION_REQUESTED'
        session.redoReason = 'reopenedByAgency'
        session.reviewReason = null
        session.decidedAt = null
        current.capture.rejections = {}
        session.token = deps.newToken()
        renewLink(session, now)
        pushEvent(session, deps.newId(), 'reopened', 'operator', now)
        return current
      })
      if (record.session.evidencePurgePending && deps.purgeEvidence) {
        await deps.purgeEvidence(id).catch(() => undefined)
        return (await readSession(deps, { id })).session
      }
      return record.session
    },
  }
}
