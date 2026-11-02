import type { Prisma } from '@prisma/client'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { FaceCheckDatabase } from '../types/access'
import type {
  FaceCheckInvitationDelivery,
  FaceCheckInvitationJob,
  FaceCheckInvitationRepository,
} from '../types/invitation-email'
import type { SessionRecord } from '../types/verification.types'
import { pendingAdvance } from '../verification/domain/session-rules'
import { faceCheckContactEmail } from '../utils/contact-email'
import { captureTokenHash, DataCipher } from './data-cipher'

export class PrismaFaceCheckInvitationRepository implements FaceCheckInvitationRepository {
  constructor(
    private readonly database: FaceCheckDatabase,
    private readonly cipher: DataCipher,
  ) {}

  private available(now: Date): Prisma.FaceCheckInvitationEmailWhereInput {
    return {
      sentAt: null,
      nextAttemptAt: { lte: now },
      OR: [{ status: 'PENDING' }, { status: 'SENDING', leaseExpiresAt: { lte: now } }],
    }
  }

  async due(input: { sessionId?: string; limit: number }, now: Date) {
    const rows = await this.database.faceCheckInvitationEmail.findMany({
      where: { ...this.available(now), ...(input.sessionId ? { sessionId: input.sessionId } : {}) },
      select: {
        id: true,
        sessionId: true,
        tenantId: true,
        tokenHash: true,
        locale: true,
        attempts: true,
        session: { select: { expiresAt: true } },
      },
      orderBy: [{ nextAttemptAt: 'asc' }, { id: 'asc' }],
      take: input.limit,
    })
    return rows.map(({ session, locale, ...row }) => ({
      ...row,
      locale: locale as AppLocale,
      expiresAt: session.expiresAt,
    }))
  }

  async claim(job: FaceCheckInvitationJob, leaseId: string, until: Date, now: Date) {
    const result = await this.database.faceCheckInvitationEmail.updateMany({
      where: {
        id: job.id,
        tenantId: job.tenantId,
        tokenHash: job.tokenHash,
        attempts: job.attempts,
        ...this.available(now),
      },
      data: { status: 'SENDING', leaseId, leaseExpiresAt: until, attempts: { increment: 1 } },
    })
    return result.count === 1
  }

  private owned(job: FaceCheckInvitationJob, leaseId: string, now: Date) {
    return {
      id: job.id,
      tenantId: job.tenantId,
      sessionId: job.sessionId,
      tokenHash: job.tokenHash,
      status: 'SENDING',
      sentAt: null,
      leaseId,
      leaseExpiresAt: { gt: now },
    }
  }

  async delivery(
    job: FaceCheckInvitationJob,
    leaseId: string,
    now: Date,
  ): Promise<FaceCheckInvitationDelivery | null> {
    const row = await this.database.faceCheckInvitationEmail.findFirst({
      where: this.owned(job, leaseId, now),
      select: {
        session: {
          select: {
            id: true,
            tenantId: true,
            propertyId: true,
            tokenHash: true,
            status: true,
            expiresAt: true,
            encryptedRecord: true,
            candidateUserId: true,
            candidateUser: { select: { active: true, emailVerifiedAt: true, email: true } },
            tenant: { select: { name: true, status: true, accountType: true } },
            property: { select: { tenantId: true, responsibleId: true } },
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
          },
        },
      },
    })
    if (!row) return null
    const session = row.session
    const issuer = session.requestedBy
    if (
      session.id !== job.sessionId ||
      session.tenantId !== job.tenantId ||
      session.tokenHash !== job.tokenHash ||
      session.expiresAt.getTime() <= now.getTime() ||
      !['CREATED', 'IN_PROGRESS', 'RESUBMISSION_REQUESTED'].includes(session.status) ||
      !['ACTIVE', 'TRIAL'].includes(session.tenant.status) ||
      !['AGENCY', 'BROKER'].includes(session.tenant.accountType) ||
      !issuer.active ||
      !issuer.emailVerifiedAt ||
      !issuer.membershipApprovedAt ||
      issuer.tenantId !== session.tenantId ||
      session.property.tenantId !== session.tenantId ||
      (issuer.role !== 'OWNER' &&
        (issuer.role !== 'AGENT' || session.property.responsibleId !== issuer.id))
    )
      return null
    try {
      const { session: payload } = this.cipher.decrypt<SessionRecord>(
        session.encryptedRecord,
        `session:${session.tenantId}:${session.id}`,
      )
      const expiresAt = Date.parse(payload.expiresAt)
      const to = faceCheckContactEmail(payload.contact)
      if (
        !to ||
        (session.candidateUserId !== null &&
          (!session.candidateUser?.active ||
            !session.candidateUser.emailVerifiedAt ||
            faceCheckContactEmail(session.candidateUser.email) !== to)) ||
        payload.id !== session.id ||
        payload.propertyId !== session.propertyId ||
        payload.status !== session.status ||
        payload.captureMode !== 'camera' ||
        !Number.isFinite(expiresAt) ||
        expiresAt <= now.getTime() ||
        (payload.status === 'IN_PROGRESS' &&
          payload.captureDeadline !== null &&
          (!Number.isFinite(Date.parse(payload.captureDeadline)) ||
            Date.parse(payload.captureDeadline) <= now.getTime())) ||
        pendingAdvance(payload, now.getTime()) === 'expire' ||
        !/^[a-f0-9]{64}$/.test(payload.token) ||
        captureTokenHash(payload.token) !== job.tokenHash
      )
        return null
      return {
        to,
        personName: payload.personName,
        agencyName: session.tenant.name,
        token: payload.token,
        expiresAt: new Date(
          Math.min(
            expiresAt,
            session.expiresAt.getTime(),
            payload.status === 'IN_PROGRESS' && payload.captureDeadline !== null
              ? Date.parse(payload.captureDeadline)
              : Infinity,
          ),
        ).toISOString(),
      }
    } catch {
      return null
    }
  }

  async complete(job: FaceCheckInvitationJob, leaseId: string, now: Date) {
    const result = await this.database.faceCheckInvitationEmail.updateMany({
      where: this.owned(job, leaseId, now),
      data: {
        status: 'SENT',
        sentAt: now,
        leaseId: null,
        leaseExpiresAt: null,
        lastErrorCode: null,
      },
    })
    return result.count === 1
  }

  async cancel(job: FaceCheckInvitationJob, leaseId: string, now: Date) {
    const result = await this.database.faceCheckInvitationEmail.updateMany({
      where: this.owned(job, leaseId, now),
      data: {
        status: 'CANCELLED',
        leaseId: null,
        leaseExpiresAt: null,
        lastErrorCode: 'INVITATION_NOT_ELIGIBLE',
      },
    })
    return result.count === 1
  }

  async retry(
    job: FaceCheckInvitationJob,
    leaseId: string,
    next: Date,
    code: 'DELIVERY_FAILED' | 'DELIVERY_TIMEOUT',
    now: Date,
  ) {
    await this.database.faceCheckInvitationEmail.updateMany({
      where: this.owned(job, leaseId, now),
      data: {
        status: 'PENDING',
        nextAttemptAt: next,
        leaseId: null,
        leaseExpiresAt: null,
        lastErrorCode: code,
      },
    })
  }
}
