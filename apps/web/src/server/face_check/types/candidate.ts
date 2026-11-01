import type { TenantAccountType, UserRole } from '@prisma/client'
import type { SessionStatus } from './session.types'

export interface FaceCheckCandidate {
  userId: string
  tenantId: string
  role: UserRole
  accountType: TenantAccountType
}

export interface FaceCheckCandidateVerification {
  id: string
  propertyTitle: string
  agencyName: string
  status: SessionStatus
  createdAt: string
  expiresAt: string
  captureUrl: string | null
}

export interface FaceCheckCandidateVerificationData extends Omit<
  FaceCheckCandidateVerification,
  'captureUrl'
> {
  captureToken: string | null
}

export interface FaceCheckCandidateVerificationRepository {
  count(candidate: FaceCheckCandidate): Promise<number>
  list(candidate: FaceCheckCandidate): Promise<FaceCheckCandidateVerificationData[]>
}

export interface FaceCheckCandidateVerificationCounts {
  count: number
  pendingCount: number
}

export interface FaceCheckAccessView {
  allowed: boolean
  candidateVerifications: boolean
  role?: UserRole
  accountType?: TenantAccountType
}
