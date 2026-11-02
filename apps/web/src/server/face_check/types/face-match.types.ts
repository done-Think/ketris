import type {
  DocumentCheck,
  DocumentType,
  EvidenceKind,
  LivenessChallenge,
  LivenessDiagnostics,
  LivenessIssue,
  PhotoDiagnostics,
  PhotoIssue,
  RedoReason,
  ReviewReason,
  SessionAlert,
  SimilarityAttempt,
} from '@server/face_check/types/session.types'
import type { DocumentRegionsResult } from '@server/face_check/types/document-import.types'
import type { LivenessProximityResult } from '@server/face_check/types/liveness-proximity.types'
import type { FaceFramingResult } from './face-framing.types'

export interface DetectedFace {
  opened: boolean
  facesFound: number
  detectionScore: number | null
  interocularPx: number | null
}

export interface FaceMatchResult {
  similarity: number | null
  document: DetectedFace
  selfie: DetectedFace
}

export interface DocumentReadingSummary {
  cardDetected: boolean
  documentType: DocumentType | null
  cpfRead: boolean
  cpfMatches: boolean | null
  nameFound: boolean | null
}

export interface PhotoInspection {
  issues: PhotoIssue[]
  hashes: string[]
  liveScore: number | null
  document: DocumentReadingSummary | null
  diagnostics?: PhotoDiagnostics | null
}

export interface ExpectedPerson {
  name: string
  cpf: string | null
}

export interface LivenessFrame {
  challenge: LivenessChallenge
  image: Uint8Array
}

export interface LivenessResult {
  passed: boolean
  issues: LivenessIssue[]
  liveScore: number | null
  diagnostics?: LivenessDiagnostics | null
}

export interface FaceEngine {
  framing?(image: Uint8Array): Promise<FaceFramingResult>
  proximity?(selfie: Uint8Array, image: Uint8Array): Promise<LivenessProximityResult>
  documentRegions?(image: Uint8Array): Promise<DocumentRegionsResult>
  match(document: Uint8Array, selfie: Uint8Array): Promise<FaceMatchResult>
  inspect(kind: EvidenceKind, image: Uint8Array, expected: ExpectedPerson): Promise<PhotoInspection>
  verifyLiveness(selfie: Uint8Array, frames: LivenessFrame[]): Promise<LivenessResult>
}

export interface IssuedChallenges {
  challenges: LivenessChallenge[]
  step: number
  checkpointAt: number
}

export interface LivenessProgress {
  remaining: number
}

export interface DeferredLivenessPlan extends LivenessSequenceState {
  planId: string
  expiresAt: string
}

export interface LivenessSequenceState {
  challenges: LivenessChallenge[]
  step: number
}

export type RejectionCounts = Partial<Record<EvidenceKind | 'liveness', number>>

export interface CapturedImage {
  bytes: Uint8Array
  contentType: string
}

export interface SimilarityDecisionInput {
  similarity: number | null
  attempt: number
  maxAttempts: number
  checksPassed: boolean
  autoApproval: boolean
}

export interface VerificationChecksInput {
  check: DocumentCheck | null
  expectsCpf: boolean
  match: FaceMatchResult
  alerts: SessionAlert[]
}

export interface SimilarityDecision {
  status: SimilarityAttempt['status']
  reviewReason: ReviewReason | null
  redoReason: RedoReason | null
  alerts: SessionAlert[]
}
