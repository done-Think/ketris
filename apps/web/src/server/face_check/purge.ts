import { randomUUID } from 'node:crypto'
import { prisma } from '@server/db/prisma'
import type { FaceCheckDatabase } from './types/access'
import type { SessionRecord } from './types/verification.types'
import { getFaceCheckS3Client } from './infrastructure/s3-client'
import { DataCipher } from './infrastructure/data-cipher'
import {
  purgeLocalSessionPhotos,
  purgeS3SessionPhotos,
  type SessionPhotoPurgeGuard,
} from './infrastructure/photo-purge'
import { sessionLeaseMs } from './infrastructure/prisma-session-repository'
import { clearCapture } from './verification/domain/session-rules'
import { evidenceRetentionMs } from './verification/domain/evidence-policy'
import { FaceCheckError } from './http/errors'

type DeleteSessionPhotos = (
  tenantId: string,
  sessionId: string,
  guard: SessionPhotoPurgeGuard,
) => Promise<void>

const leaseDeadlineMarginMs = 5000

export class FaceCheckEvidencePurger {
  constructor(
    private readonly database: FaceCheckDatabase,
    private readonly cipher: DataCipher,
    private readonly deletePhotos: DeleteSessionPhotos,
    private readonly clock = Date.now,
  ) {}

  async execute(
    input: { sessionId?: string; limit?: number } = {},
  ): Promise<{ deleted: number; failed: number }> {
    const now = new Date(this.clock())
    const due = {
      OR: [
        { evidencePurgePending: true },
        { evidenceDeletedAt: null, evidenceExpiresAt: { lte: now } },
        {
          evidenceDeletedAt: null,
          evidenceExpiresAt: null,
          expiresAt: { lte: new Date(this.clock() - evidenceRetentionMs) },
        },
      ],
    }
    const rows = await this.database.faceCheckSession.findMany({
      where: {
        AND: [due, { OR: [{ leaseId: null }, { leaseExpiresAt: { lte: now } }] }],
        ...(input.sessionId ? { id: input.sessionId } : {}),
      },
      orderBy: { evidenceExpiresAt: 'asc' },
      take: Math.min(100, Math.max(1, input.limit ?? 25)),
    })
    let deleted = 0,
      failed = 0
    for (const row of rows) {
      const leaseId = randomUUID()
      const leaseExpiresAt = new Date(this.clock() + sessionLeaseMs)
      const claimed = await this.database.faceCheckSession.updateMany({
        where: {
          AND: [
            due,
            {
              id: row.id,
              revision: row.revision,
              OR: [{ leaseId: null }, { leaseExpiresAt: { lte: new Date(this.clock()) } }],
            },
          ],
        },
        data: {
          evidencePurgePending: true,
          evidencePurgeAttempts: { increment: 1 },
          leaseId,
          leaseExpiresAt,
        },
      })
      if (claimed.count !== 1) continue
      const controller = new AbortController()
      const abortAt = leaseExpiresAt.getTime() - leaseDeadlineMarginMs
      const timer = setTimeout(() => controller.abort(), Math.max(0, abortAt - this.clock()))
      timer.unref()
      const guard: SessionPhotoPurgeGuard = {
        signal: controller.signal,
        assertLease: async () => {
          try {
            controller.signal.throwIfAborted()
            if (this.clock() >= abortAt) throw new FaceCheckError('PHOTO_PURGE_FAILED', 503)
            const owned = await this.database.faceCheckSession.findFirst({
              where: {
                id: row.id,
                tenantId: row.tenantId,
                revision: row.revision,
                leaseId,
                evidencePurgePending: true,
                leaseExpiresAt: { gt: new Date(this.clock() + leaseDeadlineMarginMs) },
              },
              select: { id: true },
            })
            if (!owned || this.clock() >= abortAt)
              throw new FaceCheckError('PHOTO_PURGE_FAILED', 503)
            controller.signal.throwIfAborted()
          } catch {
            controller.abort()
            throw new FaceCheckError('PHOTO_PURGE_FAILED', 503)
          }
        },
      }
      try {
        await guard.assertLease()
        await this.deletePhotos(row.tenantId, row.id, guard)
        await guard.assertLease()
        const record = this.cipher.decrypt<SessionRecord>(
          row.encryptedRecord,
          `session:${row.tenantId}:${row.id}`,
        )
        const removedAt = new Date(this.clock())
        for (const evidence of record.session.evidenceHistory)
          evidence.deletedAt ??= removedAt.toISOString()
        clearCapture(record)
        record.session.evidenceDeletedAt = removedAt.toISOString()
        record.session.evidencePurgePending = false
        record.session.manualOverrideAllowed = false
        const finished = await this.database.faceCheckSession.updateMany({
          where: { id: row.id, revision: row.revision, leaseId, leaseExpiresAt: { gt: removedAt } },
          data: {
            evidenceDeletedAt: removedAt,
            evidencePurgePending: false,
            encryptedRecord: this.cipher.encrypt(record, `session:${row.tenantId}:${row.id}`),
            revision: { increment: 1 },
            leaseId: null,
            leaseExpiresAt: null,
          },
        })
        if (finished.count !== 1) throw new FaceCheckError('PHOTO_PURGE_FAILED', 503)
        deleted += 1
      } catch {
        failed += 1
        // Keep the purge queue durable; do not return object keys, capture tokens or SDK errors.
        await this.database.faceCheckSession
          .updateMany({
            where: { id: row.id, leaseId },
            data: { evidencePurgePending: true, leaseId: null, leaseExpiresAt: null },
          })
          .catch(() => undefined)
      } finally {
        clearTimeout(timer)
        controller.abort()
      }
    }
    return { deleted, failed }
  }
}

export async function purgeFaceCheckEvidence(
  input: { sessionId?: string; limit?: number } = {},
  database: FaceCheckDatabase = prisma,
) {
  const cipher = DataCipher.fromEnvironment()
  const bucket = process.env.FACE_CHECK_S3_BUCKET_NAME
  const deletePhotos: DeleteSessionPhotos = async (tenantId, sessionId, guard) => {
    if (bucket)
      return purgeS3SessionPhotos({
        client: getFaceCheckS3Client(),
        bucket,
        tenantId,
        sessionId,
        guard,
      })
    if (process.env.NODE_ENV !== 'production' && process.env.FACE_CHECK_LOCAL_STORAGE === 'true') {
      await guard.assertLease()
      await purgeLocalSessionPhotos({ tenantId, sessionId })
      await guard.assertLease()
      return
    }
    throw new FaceCheckError('PHOTO_PURGE_FAILED', 503)
  }
  return new FaceCheckEvidencePurger(database, cipher, deletePhotos).execute(input)
}
