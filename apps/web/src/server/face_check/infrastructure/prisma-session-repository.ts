import { randomUUID } from 'node:crypto'
import { requireEvidenceRetentionConfiguration } from '../config/retention'
import type { Prisma } from '@prisma/client'
import type { SessionKey, SessionRecord, SessionRepository } from '../types/verification.types'
import { FaceCheckError } from '../http/errors'
import { FaceCheckAccessScope } from './access-scope'
import { captureTokenHash, DataCipher } from './data-cipher'
import { evidenceRetentionMs, manualOverrideAllowed } from '../verification/domain/evidence-policy'

// Engine requests run while this expiring database lease is held. No interactive transaction
// or PostgreSQL connection stays open across S3/OCR/HTTP awaits. Finalization uses revision CAS.
export const sessionLeaseMs = 180_000

export class PrismaSessionRepository implements SessionRepository {
  private readonly activeLeases = new Map<
    string,
    { leaseId: string; revision: number; preparedExpiresAt?: Date }
  >()
  constructor(
    private readonly access: FaceCheckAccessScope,
    private readonly cipher: DataCipher,
    private readonly clock = Date.now,
  ) {}

  private async where(key: SessionKey): Promise<Prisma.FaceCheckSessionWhereInput> {
    return {
      AND: [
        await this.access.sessionsWhere(),
        'id' in key ? { id: key.id } : { tokenHash: captureTokenHash(key.token) },
      ],
    }
  }

  private decode(row: {
    id: string
    tenantId: string
    encryptedRecord: string
    evidenceExpiresAt?: Date | null
    evidenceDeletedAt?: Date | null
    evidencePurgePending?: boolean
  }): SessionRecord {
    const record = this.cipher.decrypt<SessionRecord>(
      row.encryptedRecord,
      `session:${row.tenantId}:${row.id}`,
    )
    record.session.evidenceExpiresAt = row.evidenceExpiresAt?.toISOString() ?? null
    record.session.evidenceDeletedAt = row.evidenceDeletedAt?.toISOString() ?? null
    record.session.evidencePurgePending = row.evidencePurgePending ?? false
    record.session.manualOverrideAllowed = manualOverrideAllowed(record.session, this.clock())
    return record
  }

  private async find(key: SessionKey) {
    let row = await this.access.database.faceCheckSession.findFirst({
      where: await this.where(key),
    })
    if (row && 'token' in this.access.scope) {
      if (row.expiresAt.getTime() <= this.clock()) throw new FaceCheckError('SESSION_EXPIRED', 410)
      row = await this.access.database.faceCheckSession.findFirst({
        where: { AND: [{ id: row.id }, await this.access.publicSessionWhere(row.requestedById)] },
      })
      if (row && row.expiresAt.getTime() <= this.clock())
        throw new FaceCheckError('SESSION_EXPIRED', 410)
    }
    return row
  }

  async prepareEvidence(sessionId: string) {
    requireEvidenceRetentionConfiguration()
    const lease = this.activeLeases.get(sessionId)
    if (!lease) throw new FaceCheckError('PERSISTENCE_BUSY', 409)
    const row = await this.access.database.faceCheckSession.findFirst({
      where: {
        AND: [
          await this.access.sessionsWhere(),
          {
            id: sessionId,
            leaseId: lease.leaseId,
            revision: lease.revision,
            evidencePurgePending: false,
            leaseExpiresAt: { gt: new Date(this.clock()) },
          },
        ],
      },
      select: { evidenceExpiresAt: true, evidenceDeletedAt: true },
    })
    if (!row) throw new FaceCheckError('PERSISTENCE_BUSY', 409)
    if (row.evidenceExpiresAt && !row.evidenceDeletedAt) {
      if (row.evidenceExpiresAt.getTime() <= this.clock())
        throw new FaceCheckError('EVIDENCE_DELETED', 410)
      lease.preparedExpiresAt = row.evidenceExpiresAt
      return
    }
    const evidenceExpiresAt = new Date(this.clock() + evidenceRetentionMs)
    const prepared = await this.access.database.faceCheckSession.updateMany({
      where: {
        AND: [
          await this.access.sessionsWhere(),
          {
            id: sessionId,
            leaseId: lease.leaseId,
            revision: lease.revision,
            evidencePurgePending: false,
            leaseExpiresAt: { gt: new Date(this.clock()) },
          },
        ],
      },
      data: { evidenceExpiresAt, evidenceDeletedAt: null },
    })
    if (prepared.count !== 1) throw new FaceCheckError('PERSISTENCE_BUSY', 409)
    lease.preparedExpiresAt = evidenceExpiresAt
  }

  async insert(record: SessionRecord) {
    const actor = await this.access.property(record.session.propertyId)
    for (const event of record.session.timeline)
      if (event.actor === 'operator') event.actor = actor.actorId
    await this.access.database.faceCheckSession.create({
      data: {
        id: record.session.id,
        tenantId: actor.tenantId,
        propertyId: record.session.propertyId,
        requestedById: actor.actorId,
        tokenHash: captureTokenHash(record.session.token),
        status: record.session.status,
        expiresAt: new Date(record.session.expiresAt),
        encryptedRecord: this.cipher.encrypt(
          record,
          `session:${actor.tenantId}:${record.session.id}`,
        ),
      },
    })
  }

  async list() {
    const where = await this.access.sessionsWhere()
    // Search/count DTOs depend on encrypted personal fields. Bound work explicitly instead of
    // silently truncating totals; batches keep each database result and connection brief.
    if ((await this.access.database.faceCheckSession.count({ where })) > 5000)
      throw new FaceCheckError('RESULT_LIMIT_EXCEEDED', 422)
    const records: SessionRecord[] = []
    let cursor: string | undefined
    while (true) {
      const rows = await this.access.database.faceCheckSession.findMany({
        where: await this.access.sessionsWhere(),
        orderBy: { id: 'asc' },
        take: 200,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      })
      records.push(...rows.map((row) => this.decode(row)))
      if (rows.length < 200) break
      cursor = rows[rows.length - 1].id
      if (records.length > 5000) throw new FaceCheckError('RESULT_LIMIT_EXCEEDED', 422)
    }
    return records
  }

  async read(key: SessionKey) {
    const row = await this.find(key)
    return row ? this.decode(row) : null
  }

  async update<T>(key: SessionKey, change: (record: SessionRecord) => Promise<T> | T): Promise<T> {
    const row = await this.find(key)
    if (!row) throw new FaceCheckError('SESSION_NOT_FOUND', 404)
    const record = this.decode(row)
    const originalToken = record.session.token
    const leaseId = randomUUID()
    const leaseExpiresAt = new Date(this.clock() + sessionLeaseMs)
    const scopeWhere =
      'token' in this.access.scope
        ? await this.access.publicSessionWhere(row.requestedById)
        : await this.access.sessionsWhere()
    const claimed = await this.access.database.faceCheckSession.updateMany({
      where: {
        AND: [
          scopeWhere,
          {
            id: row.id,
            revision: row.revision,
            OR: [{ leaseId: null }, { leaseExpiresAt: { lte: new Date(this.clock()) } }],
          },
        ],
      },
      data: { leaseId, leaseExpiresAt },
    })
    if (claimed.count !== 1) {
      if (!(await this.find(key))) throw new FaceCheckError('SESSION_NOT_FOUND', 404)
      throw new FaceCheckError('PERSISTENCE_BUSY', 409)
    }
    this.activeLeases.set(row.id, { leaseId, revision: row.revision })
    const previousEvents = record.session.timeline.length
    const previousEvidenceCount = record.session.evidenceHistory.length
    let result: T | undefined
    let failure: unknown
    let failed = false
    try {
      result = await change(record)
    } catch (error) {
      failed = true
      failure = error
    }
    try {
      // Refresh access after slow engine calls, including a portfolio transfer or account suspension.
      const finalWhere =
        'token' in this.access.scope
          ? await this.access.publicSessionWhere(row.requestedById)
          : await this.access.sessionsWhere()
      let requestedById = row.requestedById
      if ('actor' in this.access.scope) {
        const actor = await this.access.actor()
        if (record.session.token !== originalToken) requestedById = actor.actorId
        for (const event of record.session.timeline.slice(previousEvents))
          if (event.actor === 'operator') event.actor = actor.actorId
      }
      const now = this.clock()
      const prepared = this.activeLeases.get(row.id)?.preparedExpiresAt
      let evidenceExpiresAt = prepared ?? row.evidenceExpiresAt
      let evidenceDeletedAt = prepared ? null : row.evidenceDeletedAt
      let evidencePurgePending = row.evidencePurgePending
      if (record.session.evidenceHistory.length > previousEvidenceCount) {
        if (!prepared && (!evidenceExpiresAt || evidenceDeletedAt))
          evidenceExpiresAt = new Date(now + evidenceRetentionMs)
        evidenceDeletedAt = null
      }
      if (
        !evidenceExpiresAt &&
        record.session.status === 'REVIEW' &&
        row.status !== 'REVIEW' &&
        record.session.evidenceHistory.some((evidence) => !evidence.deletedAt)
      ) {
        evidenceExpiresAt = new Date(now + evidenceRetentionMs)
      }
      if (
        (record.session.status !== row.status &&
          ['APPROVED', 'REJECTED'].includes(record.session.status)) ||
        (record.session.status === 'RESUBMISSION_REQUESTED' &&
          !evidenceDeletedAt &&
          evidenceExpiresAt &&
          evidenceExpiresAt.getTime() <= now)
      )
        evidencePurgePending = true
      record.session.evidenceExpiresAt = evidenceExpiresAt?.toISOString() ?? null
      record.session.evidenceDeletedAt = evidenceDeletedAt?.toISOString() ?? null
      record.session.evidencePurgePending = evidencePurgePending
      record.session.manualOverrideAllowed = manualOverrideAllowed(record.session, now)
      const approving = row.status !== 'APPROVED' && record.session.status === 'APPROVED'
      const saved = await this.access.database.faceCheckSession.updateMany({
        where: {
          AND: [
            finalWhere,
            {
              id: row.id,
              revision: row.revision,
              leaseId,
              leaseExpiresAt: { gt: new Date(this.clock()) },
              ...(approving
                ? {
                    evidencePurgePending: false,
                    evidenceDeletedAt: null,
                    evidenceExpiresAt: { gt: new Date(this.clock()) },
                  }
                : {}),
            },
          ],
        },
        data: {
          requestedById,
          evidenceExpiresAt,
          evidenceDeletedAt,
          evidencePurgePending,
          encryptedRecord: this.cipher.encrypt(record, `session:${row.tenantId}:${row.id}`),
          tokenHash: captureTokenHash(record.session.token),
          status: record.session.status,
          expiresAt: new Date(record.session.expiresAt),
          revision: { increment: 1 },
          leaseId: null,
          leaseExpiresAt: null,
        },
      })
      if (saved.count !== 1) {
        const current = await this.find(key)
        if (!current) throw new FaceCheckError('SESSION_NOT_FOUND', 404)
        if (
          approving &&
          (current.evidenceDeletedAt ||
            current.evidencePurgePending ||
            !current.evidenceExpiresAt ||
            current.evidenceExpiresAt.getTime() <= this.clock())
        )
          throw new FaceCheckError('EVIDENCE_DELETED', 410)
        throw new FaceCheckError('PERSISTENCE_BUSY', 409)
      }
    } catch (error) {
      await this.access.database.faceCheckSession
        .updateMany({
          where: { id: row.id, leaseId },
          data: { leaseId: null, leaseExpiresAt: null },
        })
        .catch(() => undefined)
      throw error
    } finally {
      this.activeLeases.delete(row.id)
    }
    // Rejected/unavailable evidence and failed attempts must survive a validation/engine error.
    if (failed) throw failure
    return result as T
  }
}
