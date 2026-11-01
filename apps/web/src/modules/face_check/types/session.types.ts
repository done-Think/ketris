export type SessionStatus =
  | 'CREATED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'RESUBMISSION_REQUESTED'
  | 'REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ABANDONED'

export type StatusTone = 'neutral' | 'info' | 'redo' | 'warning' | 'success' | 'error'

export type DocumentType = 'RG' | 'CNH' | 'RNE'

export type AcceptedDocument = DocumentType | 'ANY'

export type DocumentSide = 'front' | 'back'

export type LivenessChallenge = 'blink' | 'turnLeft' | 'turnRight' | 'closer'

export type ReviewReason =
  | 'nearThreshold'
  | 'alternativePath'
  | 'livenessInconclusive'
  | 'attemptsExhausted'
  | 'experimentalMatch'
  | 'faceNotFound'
  | 'analysisUnavailable'
  | 'tooManyRejections'
  | 'localCaptureOnly'
  | 'lowSimilarityRepeated'
  | 'verificationChecksFailed'
  | 'documentManualReview'
  | 'autoApprovalPaused'

export type RedoReason =
  'documentIllegible' | 'selfieQuality' | 'reopenedByAgency' | 'lowSimilarity'

export type DecisionKind = 'approve' | 'redo' | 'reject'

export type DecisionReason = 'match' | 'mismatch' | 'illegible' | 'tampered' | 'liveness'

export type AlternativeReason = 'noCamera' | 'accessibility' | 'noConsent' | 'other'

export type SignalKey =
  | 'faceMatch'
  | 'liveness'
  | 'documentQuality'
  | 'selfieQuality'
  | 'interocularDistance'
  | 'documentInterocularDistance'
  | 'passiveLiveness'

export type SignalUnit = 'score' | 'px'

export interface SessionSignal {
  key: SignalKey
  value: number
  threshold: number | null
  max: number
  unit: SignalUnit
}

export type TimelineEventKind =
  | 'created'
  | 'consented'
  | 'documentSent'
  | 'selfieSent'
  | 'submitted'
  | 'autoApproved'
  | 'autoReview'
  | 'autoRedo'
  | 'alternativeRequested'
  | 'evidenceViewed'
  | 'decision'
  | 'expired'
  | 'livenessVerified'
  | 'reopened'

export type TimelineActor = 'system' | 'operator' | 'person'

export interface ConsentRecord {
  termsVersion: string
  agencyName: string
}

export interface TimelineEvent {
  id: string
  kind: TimelineEventKind
  actor: TimelineActor | string
  at: string
  decision?: DecisionKind
  reason?: DecisionReason | AlternativeReason
  note?: string
  consent?: ConsentRecord
  manualOverride?: boolean
  decisionMethod?: 'MANUAL'
}

export type CaptureMode = 'camera'

export type EvidenceKind = 'front' | 'back' | 'selfie'

export type CaptureEvidenceStep = EvidenceKind | 'liveness'
export type CaptureEvidenceStatus = 'pending' | 'accepted' | 'rejected' | 'unavailable'

export type DiagnosticLimits = Record<string, number>

export interface PhotoDiagnostics {
  kind: 'photo'
  width: number
  height: number
  brightness: number
  brightnessSource?: 'image' | 'text'
  sharpness: number
  textRegions: number
  facesFound: number
  largestFaceRatio: number | null
  largestFaceInterocularPx: number | null
  realProbability: number | null
  limits: DiagnosticLimits
}

export interface LivenessDiagnostics {
  kind: 'liveness'
  yawDelta: number | null
  closerRatio: number | null
  similarity: number | null
  realProbability: number | null
  limits: DiagnosticLimits
}

export type EvidenceDiagnostics = PhotoDiagnostics | LivenessDiagnostics

export interface CaptureEvidence {
  id: string
  step: CaptureEvidenceStep
  challenge: LivenessChallenge | null
  attempt: number
  capturedAt: string
  status: CaptureEvidenceStatus
  reason: CaptureIssue | null
  diagnostics?: EvidenceDiagnostics | null
}

export interface SimilarityAttempt {
  attempt: number
  similarity: number | null
  analyzedAt: string
  status: 'APPROVED' | 'REVIEW' | 'RESUBMISSION_REQUESTED'
}

export type PhotoIssue =
  | 'unreadable'
  | 'lowResolution'
  | 'documentFaceNotFound'
  | 'looksLikeSelfie'
  | 'selfieFaceNotFound'
  | 'multipleFaces'
  | 'faceTooSmall'
  | 'tooDark'
  | 'tooBright'
  | 'blurry'
  | 'duplicatePhoto'
  | 'looksLikeDocument'
  | 'spoofSuspected'
  | 'documentTextNotFound'
  | 'documentShapeNotFound'

export type LivenessIssue =
  | 'livenessFaceNotFound'
  | 'livenessDifferentPerson'
  | 'livenessNotTurned'
  | 'livenessExpired'
  | 'livenessIncomplete'
  | 'livenessNotCloser'
  | 'livenessSpoofSuspected'
  | 'livenessOutOfOrder'

export type CaptureIssue = PhotoIssue | LivenessIssue

export type SessionAlert =
  | 'nearIdenticalFaces'
  | 'manyRejectedPhotos'
  | 'documentManualReview'
  | 'possibleSpoof'
  | 'documentShapeNotFound'
  | 'documentTypeMismatch'
  | 'nameNotFoundOnDocument'
  | 'cpfMismatch'
  | 'lowSimilarityRepeated'
  | 'lowSimilarity'

export interface DocumentCheck {
  cardDetected: boolean
  documentTypeRead: DocumentType | null
  documentTypeMatches: boolean | null
  nameFound: boolean | null
  cpfRead: boolean
  cpfMatches: boolean | null
}

export interface VerificationSession {
  id: string
  token: string
  personName: string
  agencyName: string
  reference: string | null
  contact: string | null
  acceptedDocument: AcceptedDocument
  documentType: DocumentType | null
  status: SessionStatus
  createdAt: string
  updatedAt: string
  expiresAt: string
  captureDeadline: string | null
  decidedAt: string | null
  submittedAt: string | null
  attemptsUsed: number
  maxAttempts: number
  reviewReason: ReviewReason | null
  redoReason: RedoReason | null
  alternativePath: boolean
  propertyId: string
  purpose: 'RENT' | 'BUY'
  captureMode: CaptureMode
  evidence: EvidenceKind[]
  evidenceHistory: CaptureEvidence[]
  evidenceDeletedAt?: string | null
  evidenceExpiresAt?: string | null
  evidencePurgePending?: boolean
  manualOverrideAllowed?: boolean
  decisionMethod?: 'MANUAL' | null
  manualOverride?: boolean
  similarityAttempts: SimilarityAttempt[]
  alerts: SessionAlert[]
  cpf: string | null
  documentCheck: DocumentCheck | null
  signals: SessionSignal[]
  timeline: TimelineEvent[]
}

export type SessionFilter = 'all' | 'review' | 'open' | 'redo' | 'approved' | 'rejected' | 'closed'

export interface SessionListQuery {
  filter: SessionFilter
  search: string
  page: number
  pageSize: number
}

export interface SessionListResult {
  items: VerificationSession[]
  total: number
  counts: Record<SessionFilter, number>
}

export interface CreateSessionInput {
  propertyId: string
  purpose: 'RENT' | 'BUY'
  personName: string
  cpf: string
  reference: string
  contact: string
  acceptedDocument: AcceptedDocument
  expiresInHours: number
}

export interface DecisionInput {
  decision: DecisionKind
  reason: DecisionReason | null
  note: string
  manualOverride?: true
}

export type OverviewScope = 'real'

export interface FaceCheckProperty {
  id: string
  title: string
  address?: string
}

export interface DailySessionsPoint {
  day: string
  approved: number
  rejected: number
  redo: number
  review: number
}

export interface OverviewMetrics {
  completed: number
  approved: number
  rejected: number
  autoApprovalRate: number
  autoApproved: number
  inReview: number
  oldestReviewAt: string | null
  medianDecisionSeconds: number | null
  redoRequests: number
  daily: DailySessionsPoint[]
  reviewQueue: VerificationSession[]
}

export interface VerificationSettings {
  agencyName: string
  faceMatchThreshold: number
  maxAttempts: number
  allowGalleryUpload: boolean
}

export interface ConsentInput {
  accepted: true
  termsVersion: string
}

export interface CaptureSessionView {
  token: string
  agencyName: string
  reference: string | null
  acceptedDocument: AcceptedDocument
  status: SessionStatus
  captureMode: CaptureMode
  allowGalleryUpload: boolean
  attemptsLeft: number
  maxAttempts: number
  expiresAt: string
  redoReason: RedoReason | null
}

export interface CaptureStatusView {
  status: SessionStatus
  progress: number
  attemptsLeft: number
  redoReason: RedoReason | null
}

export interface AlternativeRequestInput {
  reason: AlternativeReason | null
  contact: string
}
