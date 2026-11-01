import type { Prisma } from '@prisma/client'
import { resolveFaceCheckCandidate } from '../require-face-check-candidate'
import { FaceCheckError } from '../http/errors'
import type { FaceCheckDatabase } from '../types/access'
import type {
  FaceCheckCandidate,
  FaceCheckCandidateVerificationData,
  FaceCheckCandidateVerificationRepository,
} from '../types/candidate'
import type { SessionStatus } from '../types/session.types'
import type { SessionRecord } from '../types/verification.types'
import { pendingAdvance } from '../verification/domain/session-rules'
import { captureTokenHash, DataCipher } from './data-cipher'

const candidateSelect = {
  id: true,
  tenantId: true,
  propertyId: true,
  requestedById: true,
  status: true,
  createdAt: true,
  expiresAt: true,
  tokenHash: true,
  encryptedRecord: true,
  property: { select: { title: true, tenantId: true, responsibleId: true } },
  tenant: { select: { name: true, status: true, accountType: true } },
  requestedBy: {
    select: {
      id: true,
      tenantId: true,
      role: true,
      active: true,
      emailVerifiedAt: true,
      membershipApprovedAt: true,
    },
  },
} satisfies Prisma.FaceCheckSessionSelect
type CandidateRow = Prisma.FaceCheckSessionGetPayload<{ select: typeof candidateSelect }>

export class PrismaCandidateVerificationRepository implements FaceCheckCandidateVerificationRepository {
  constructor(
    private readonly database: FaceCheckDatabase,
    private readonly cipher?: DataCipher,
    private readonly clock = Date.now,
  ) {}

  private async where(candidate: FaceCheckCandidate): Promise<Prisma.FaceCheckSessionWhereInput> {
    const current = await resolveFaceCheckCandidate(
      { userId: candidate.userId, tenantId: candidate.tenantId },
      this.database,
    )
    // A candidate's personal account can belong to another tenant. The explicit global User.id
    // association is the grant; it never grants this user access to the provider's console.
    return {
      candidateUserId: current.userId,
      candidateUser: {
        id: current.userId,
        tenantId: current.tenantId,
        active: true,
        emailVerifiedAt: { not: null },
        membershipApprovedAt: { not: null },
        tenant: { status: { in: ['ACTIVE', 'TRIAL'] } },
      },
    }
  }

  async count(candidate: FaceCheckCandidate) {
    return this.database.faceCheckSession.count({ where: await this.where(candidate) })
  }

  private captureData(
    row: CandidateRow,
  ): Pick<FaceCheckCandidateVerificationData, 'status' | 'captureToken'> {
    const pending = ['CREATED', 'IN_PROGRESS', 'RESUBMISSION_REQUESTED'].includes(row.status)
    const expired = pending && row.expiresAt.getTime() <= this.clock()
    const fallback = {
      status: (expired ? 'EXPIRED' : row.status) as SessionStatus,
      captureToken: null,
    }
    const issuer = row.requestedBy
    if (
      !pending ||
      expired ||
      !issuer.active ||
      !issuer.emailVerifiedAt ||
      !issuer.membershipApprovedAt ||
      issuer.tenantId !== row.tenantId ||
      row.property.tenantId !== row.tenantId ||
      !['ACTIVE', 'TRIAL'].includes(row.tenant.status) ||
      !['AGENCY', 'BROKER'].includes(row.tenant.accountType) ||
      (issuer.role !== 'OWNER' &&
        (issuer.role !== 'AGENT' || row.property.responsibleId !== issuer.id))
    )
      return fallback
    try {
      const record = (this.cipher ?? DataCipher.fromEnvironment()).decrypt<SessionRecord>(
        row.encryptedRecord,
        `session:${row.tenantId}:${row.id}`,
      )
      if (
        record.session.id !== row.id ||
        record.session.propertyId !== row.propertyId ||
        record.session.captureMode !== 'camera' ||
        record.session.status !== row.status
      )
        return fallback
      if (
        Date.parse(record.session.expiresAt) <= this.clock() ||
        pendingAdvance(record.session, this.clock()) === 'expire'
      )
        return { ...fallback, status: 'EXPIRED' }
      const token = record.session.token
      return /^[a-f0-9]{64}$/.test(token) && captureTokenHash(token) === row.tokenHash
        ? { status: record.session.status, captureToken: token }
        : fallback
    } catch {
      // A corrupt/unavailable ciphertext must never produce a link or leak the payload.
      return fallback
    }
  }

  async list(candidate: FaceCheckCandidate): Promise<FaceCheckCandidateVerificationData[]> {
    const where = await this.where(candidate)
    if ((await this.database.faceCheckSession.count({ where })) > 5000)
      throw new FaceCheckError('RESULT_LIMIT_EXCEEDED', 422)
    const rows = await this.database.faceCheckSession.findMany({
      where,
      select: candidateSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 5000,
    })
    return rows.map((row) => ({
      id: row.id,
      propertyTitle: row.property.title,
      agencyName: row.tenant.name,
      ...this.captureData(row),
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
    }))
  }
}
