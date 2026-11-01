import type {
  FaceCheckAccessView,
  FaceCheckCandidate,
  FaceCheckCandidateVerification,
  FaceCheckCandidateVerificationCounts,
  FaceCheckCandidateVerificationRepository,
} from '../../../types/candidate'

export class ListMyFaceCheckVerificationsUseCase {
  constructor(private readonly verifications: FaceCheckCandidateVerificationRepository) {}

  async execute(
    candidate: FaceCheckCandidate,
    captureUrl: (token: string, id: string) => string,
  ): Promise<{ items: FaceCheckCandidateVerification[] }> {
    const rows = await this.verifications.list(candidate)
    return {
      items: rows.map((row) => ({
        id: row.id,
        propertyTitle: row.propertyTitle,
        agencyName: row.agencyName,
        status: row.status,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        captureUrl: row.captureToken ? captureUrl(row.captureToken, row.id) : null,
      })),
    }
  }
}

export class GetMyFaceCheckVerificationCountsUseCase {
  constructor(private readonly verifications: FaceCheckCandidateVerificationRepository) {}

  async execute(candidate: FaceCheckCandidate): Promise<FaceCheckCandidateVerificationCounts> {
    const rows = await this.verifications.list(candidate)
    return {
      count: rows.length,
      pendingCount: rows.filter((row) => row.captureToken !== null).length,
    }
  }
}

export class GetFaceCheckAccessUseCase {
  constructor(private readonly verifications: FaceCheckCandidateVerificationRepository) {}

  async execute(candidate: FaceCheckCandidate): Promise<FaceCheckAccessView> {
    const allowed =
      ['OWNER', 'AGENT'].includes(candidate.role) &&
      ['AGENCY', 'BROKER'].includes(candidate.accountType)
    return {
      allowed,
      candidateVerifications: (await this.verifications.count(candidate)) > 0,
      role: candidate.role,
      accountType: candidate.accountType,
    }
  }
}
