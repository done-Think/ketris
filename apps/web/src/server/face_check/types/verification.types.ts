import type {
  CaptureMode,
  DocumentSide,
  EvidenceKind,
  SimulatedOutcome,
  VerificationSession,
  VerificationSettings,
} from '@server/face_check/types/session.types'

import type { VerificationErrorCode } from '@server/face_check/types/api.types'

import type {
  CapturedImage,
  DocumentReadingSummary,
  FaceEngine,
  IssuedChallenges,
  RejectionCounts,
} from './face-match.types'

export type { VerificationErrorCode }

export type Clock = () => number

export interface PhotoFingerprint {
  sha256: string
  hashes: string[]
}

export interface ActivePhoto extends PhotoFingerprint {
  evidenceId: string
  liveScore: number | null
  document: DocumentReadingSummary | null
}

export type ActivePhotos = Partial<Record<EvidenceKind, ActivePhoto>>

export interface CaptureState {
  plan?: { id: string; expiresAt: string } | null
  photos: ActivePhotos
  documentReadings: Partial<Record<DocumentSide, DocumentReadingSummary>>
  challenges: IssuedChallenges | null
  rejections: RejectionCounts
  livenessVerified: boolean
  liveScore: number | null
}

export interface SessionRecord {
  session: VerificationSession
  capture: CaptureState
}

export type SessionKey = { id: string } | { token: string }

export interface SessionRepository {
  insert(record: SessionRecord): Promise<void>
  prepareEvidence?(sessionId: string): Promise<void>
  list(): Promise<SessionRecord[]>
  read(key: SessionKey): Promise<SessionRecord | null>
  update<T>(key: SessionKey, change: (record: SessionRecord) => Promise<T> | T): Promise<T>
}

export interface PhotoStore {
  save(sessionId: string, evidenceId: string, image: CapturedImage): Promise<void>
  load(sessionId: string, evidenceId: string): Promise<CapturedImage | null>
}

export interface SettingsRepository {
  get(): Promise<VerificationSettings>
  save(settings: VerificationSettings): Promise<VerificationSettings>
}

export interface AnalysisRunner {
  start(task: () => Promise<void>): Promise<void>
  idle(): Promise<void>
}

export interface VerificationDependencies {
  actorId?: string
  purgeEvidence?: (sessionId: string) => Promise<void>
  sessions: SessionRepository
  photos: PhotoStore
  settings: SettingsRepository
  analyses: AnalysisRunner
  faceEngine: FaceEngine | null
  clock: Clock
  random: () => number
  newToken: () => string
  newId: () => string
}

export interface NewSessionParams {
  personName: string
  agencyName: string
  cpf: string | null
  reference: string | null
  contact: string | null
  acceptedDocument: VerificationSession['acceptedDocument']
  createdAt: number
  expiresAt: number
  outcome: SimulatedOutcome
  token: string
  captureMode: CaptureMode
  maxAttempts: number
  id: string
}

export type OutcomeBucket = 'approved' | 'rejected' | 'redo' | 'review'

export type VerificationUseCases = ReturnType<
  typeof import('../verification/container-factory').buildVerificationUseCases
>
