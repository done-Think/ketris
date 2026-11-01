import type { SessionStatus } from './session.types'

export interface CandidateVerification {
  id: string
  propertyTitle: string
  agencyName: string
  status: SessionStatus
  createdAt: string
  expiresAt: string
  captureUrl: string | null
}

export interface CandidateVerificationsResponse {
  items: CandidateVerification[]
}
