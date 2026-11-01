import type {
  CaptureSessionView,
  CaptureStatusView,
  DocumentSide,
  DocumentType,
  EvidenceKind,
  LivenessChallenge,
  SessionAlert,
  SessionFilter,
  SessionStatus,
  TimelineEvent,
  TimelineEventKind,
  VerificationSession,
} from '@server/face_check/types/session.types'

import type { CaptureState, NewSessionParams, SessionRecord } from '../../types/verification.types'
import { VerificationError } from './verification-error'

export const minuteMs = 60 * 1000
export const hourMs = 60 * minuteMs
export const dayMs = 24 * hourMs
export const defaultMaxAttempts = 3
export const captureWindowMs = 15 * minuteMs
export const redoLinkWindowMs = 24 * hourMs
export const submittedPhaseMs = 1500
export const processingPhaseMs = 4500
export const livenessStepWindowMs = 15_000
export const maxRejectionsPerStep = 5
export const documentRejectionsBeforeContinuation = 3
export const livenessPool: LivenessChallenge[] = ['turnLeft', 'turnRight', 'closer']
export const evidenceOrder: EvidenceKind[] = ['front', 'back', 'selfie']

export const sessionFilterStatuses: Record<SessionFilter, SessionStatus[] | null> = {
  all: null,
  review: ['REVIEW'],
  open: ['CREATED', 'IN_PROGRESS', 'SUBMITTED', 'PROCESSING'],
  redo: ['RESUBMISSION_REQUESTED'],
  approved: ['APPROVED'],
  rejected: ['REJECTED'],
  closed: ['EXPIRED', 'ABANDONED'],
}

export function matchesFilter(session: VerificationSession, filter: SessionFilter) {
  const statuses = sessionFilterStatuses[filter]

  return !statuses || statuses.includes(session.status)
}

export function isDemo(session: VerificationSession) {
  return session.captureMode !== 'camera'
}

export function iso(at: number) {
  return new Date(at).toISOString()
}

export function emptyCaptureState(): CaptureState {
  return {
    photos: {},
    documentReadings: {},
    challenges: null,
    rejections: {},
    livenessVerified: false,
    liveScore: null,
  }
}

export function pushEvent(
  session: VerificationSession,
  id: string,
  kind: TimelineEventKind,
  actor: TimelineEvent['actor'],
  at: number,
  details: Pick<
    TimelineEvent,
    'decision' | 'reason' | 'note' | 'consent' | 'decisionMethod' | 'manualOverride'
  > = {},
) {
  session.timeline.push({ id, kind, actor, at: iso(at), ...details })
  session.updatedAt = iso(at)
}

export function newSessionRecord(params: NewSessionParams, eventId: string): SessionRecord {
  const createdAt = iso(params.createdAt)
  const session: VerificationSession = {
    id: params.id,
    propertyId: '',
    purpose: 'RENT',
    token: params.token,
    personName: params.personName,
    agencyName: params.agencyName,
    reference: params.reference,
    contact: params.contact,
    acceptedDocument: params.acceptedDocument,
    documentType: null,
    status: 'CREATED',
    createdAt,
    updatedAt: createdAt,
    expiresAt: iso(params.expiresAt),
    captureDeadline: null,
    decidedAt: null,
    submittedAt: null,
    attemptsUsed: 0,
    maxAttempts: params.maxAttempts,
    reviewReason: null,
    redoReason: null,
    alternativePath: false,
    simulatedOutcome: params.outcome,
    captureMode: params.captureMode,
    evidence: [],
    evidenceHistory: [],
    similarityAttempts: [],
    alerts: [],
    cpf: params.cpf,
    documentCheck: null,
    signals: [],
    timeline: [{ id: eventId, kind: 'created', actor: 'operator', at: createdAt }],
  }

  return { session, capture: emptyCaptureState() }
}

export function ensureCapturable(session: VerificationSession) {
  if (session.status === 'EXPIRED') throw new VerificationError('SESSION_EXPIRED')
  if (!['CREATED', 'IN_PROGRESS', 'RESUBMISSION_REQUESTED'].includes(session.status))
    throw new VerificationError('INVALID_CAPTURE_STATE')
  if (session.attemptsUsed >= session.maxAttempts) throw new VerificationError('NO_ATTEMPTS_LEFT')
}

export function ensureInProgress(session: VerificationSession) {
  if (session.status === 'EXPIRED') throw new VerificationError('SESSION_EXPIRED')
  if (session.status !== 'IN_PROGRESS') throw new VerificationError('INVALID_CAPTURE_STATE')
  if (session.attemptsUsed >= session.maxAttempts) throw new VerificationError('NO_ATTEMPTS_LEFT')
}

export function ensureAcceptedDocument(
  session: VerificationSession,
  side: DocumentSide,
  documentType: DocumentType,
) {
  if (session.acceptedDocument !== 'ANY' && documentType !== session.acceptedDocument)
    throw new VerificationError('DOCUMENT_TYPE_NOT_ACCEPTED')
  if (side === 'back' && session.documentType && session.documentType !== documentType)
    throw new VerificationError('DOCUMENT_TYPE_NOT_ACCEPTED')
}

export function renewLink(session: VerificationSession, now: number) {
  session.captureDeadline = null
  session.expiresAt = iso(Math.max(Date.parse(session.expiresAt), now + redoLinkWindowMs))
}

export function clearCapture(record: SessionRecord) {
  record.capture.photos = {}
  record.capture.challenges = null
  record.capture.livenessVerified = false
  record.capture.liveScore = null
  record.session.evidence = []
}

export function addAlerts(session: VerificationSession, alerts: SessionAlert[]) {
  session.alerts = [...new Set([...session.alerts, ...alerts])]
}

export function syncEvidence(record: SessionRecord) {
  record.session.evidence = evidenceOrder.filter((kind) => record.capture.photos[kind])
}

export function registerRejection(
  record: SessionRecord,
  step: EvidenceKind | 'liveness',
  now: number,
  eventId: string,
) {
  const total = (record.capture.rejections[step] ?? 0) + 1
  record.capture.rejections = { ...record.capture.rejections, [step]: total }
  if (
    step === 'front' ||
    step === 'back' ||
    total < maxRejectionsPerStep ||
    record.session.status !== 'IN_PROGRESS'
  )
    return
  record.session.status = 'REVIEW'
  record.session.reviewReason = 'tooManyRejections'
  addAlerts(record.session, ['manyRejectedPhotos'])
  pushEvent(record.session, eventId, 'autoReview', 'system', now)
}

export function pendingAdvance(session: VerificationSession, now: number) {
  if (
    ['CREATED', 'IN_PROGRESS', 'RESUBMISSION_REQUESTED'].includes(session.status) &&
    now > Date.parse(session.expiresAt)
  )
    return 'expire'
  if (
    session.status === 'IN_PROGRESS' &&
    session.captureDeadline !== null &&
    now > Date.parse(session.captureDeadline)
  )
    return 'expire'
  return null
}

export function advance(record: SessionRecord, now: number, eventId: string) {
  const step = pendingAdvance(record.session, now)
  if (step === 'expire') {
    record.session.status = 'EXPIRED'
    record.session.captureDeadline = null
    clearCapture(record)
    pushEvent(record.session, eventId, 'expired', 'system', now)
  }

  return step !== null
}

export function toCaptureView(
  session: VerificationSession,
  allowGalleryUpload: boolean,
): CaptureSessionView {
  return {
    token: session.token,
    agencyName: session.agencyName,
    reference: session.reference,
    acceptedDocument: session.acceptedDocument,
    status: session.status,
    captureMode: session.captureMode,
    allowGalleryUpload,
    attemptsLeft: Math.max(0, session.maxAttempts - session.attemptsUsed),
    maxAttempts: session.maxAttempts,
    expiresAt: session.expiresAt,
    redoReason: session.redoReason,
  }
}

export function toStatusView(session: VerificationSession, now: number): CaptureStatusView {
  const elapsed = session.submittedAt ? now - Date.parse(session.submittedAt) : 0
  const total = submittedPhaseMs + processingPhaseMs
  const inFlight = ['SUBMITTED', 'PROCESSING'].includes(session.status)

  return {
    status: session.status,
    progress: inFlight ? Math.min(99, Math.round(8 + (elapsed / total) * 92)) : 100,
    attemptsLeft: Math.max(0, session.maxAttempts - session.attemptsUsed),
    redoReason: session.redoReason,
  }
}
