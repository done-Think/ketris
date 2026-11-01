import type { CaptureIssue, LivenessChallenge, VerificationSession } from './session.types'

export type VerificationErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_NOT_IN_REVIEW'
  | 'INVALID_CAPTURE_STATE'
  | 'NO_ATTEMPTS_LEFT'
  | 'AGENCY_NAME_MISSING'
  | 'CONSENT_TERMS_OUTDATED'
  | 'DOCUMENT_TYPE_NOT_ACCEPTED'
  | 'IMAGE_REQUIRED'
  | 'EVIDENCE_NOT_REVEALED'
  | 'EVIDENCE_NOT_FOUND'
  | 'PHOTO_REJECTED'
  | 'ANALYSIS_UNAVAILABLE'
  | 'ANALYSIS_TIMEOUT'
  | 'ANALYSIS_FAILED'
  | 'ANALYSIS_INVALID_RESPONSE'
  | 'LIVENESS_FAILED'
  | 'SESSION_NOT_REJECTED'
  | 'VERIFICATION_INCOMPLETE'

export type ApiErrorCode =
  | VerificationErrorCode
  | 'PAYLOAD_TOO_LARGE'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'
  | 'PERSISTENCE_BUSY'
  | 'PERSISTENCE_UNAVAILABLE'

export interface ApiErrorBody {
  code?: ApiErrorCode
  reason?: CaptureIssue
}

export type QueryParams = Record<string, string | number>

export interface FormRequestOptions {
  signal?: AbortSignal
  timeout?: number
}

export interface CreatedSession {
  session: VerificationSession
  captureUrl: string
}

export interface ChallengesResponse {
  challenges: LivenessChallenge[]
}
