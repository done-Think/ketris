import { randomBytes, randomInt, randomUUID } from 'node:crypto'
import { prisma } from '@server/db/prisma'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { FaceCheckScope, FaceCheckDatabase } from './types/access'
import { FaceCheckAccessScope } from './infrastructure/access-scope'
import { DataCipher } from './infrastructure/data-cipher'
import { PrismaSessionRepository } from './infrastructure/prisma-session-repository'
import { PrismaSettingsRepository } from './infrastructure/prisma-settings-repository'
import { getFaceCheckS3Client } from './infrastructure/s3-client'
import { S3PhotoStore } from './infrastructure/s3-photo-store'
import { LocalPhotoStore } from './infrastructure/local-photo-store'
import { FaceCheckError } from './http/errors'
import { HttpFaceEngine } from './face-match/http-face-engine'
import { buildVerificationUseCases } from './verification/container-factory'
import { purgeFaceCheckEvidence } from './purge'

export async function faceCheckContainer(
  scope: FaceCheckScope,
  database: FaceCheckDatabase = prisma,
  options: { invitationLocale?: AppLocale } = {},
) {
  const access = new FaceCheckAccessScope(database, scope)
  const settingsScope = await access.settings()
  const cipher = DataCipher.fromEnvironment()
  const sessions = new PrismaSessionRepository(access, cipher, Date.now, options.invitationLocale)
  const settings = new PrismaSettingsRepository(access, cipher)
  const bucket = process.env.FACE_CHECK_S3_BUCKET_NAME
  const photos = bucket
    ? new S3PhotoStore(getFaceCheckS3Client(), bucket, settingsScope.tenantId, cipher, sessions)
    : process.env.NODE_ENV !== 'production' && process.env.FACE_CHECK_LOCAL_STORAGE === 'true'
      ? new LocalPhotoStore(settingsScope.tenantId, cipher, sessions)
      : null
  if (!photos) throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
  const engineUrl = process.env.FACE_CHECK_ENGINE_URL
  const engineToken = process.env.FACE_CHECK_ENGINE_TOKEN
  const faceEngine =
    engineUrl && engineToken
      ? new HttpFaceEngine(engineUrl.replace(/\/$/, ''), 60_000, engineToken)
      : null
  return buildVerificationUseCases({
    sessions,
    settings,
    photos,
    faceEngine,
    actorId: 'actor' in scope ? scope.actor.actorId : undefined,
    purgeEvidence: async (sessionId) => {
      await purgeFaceCheckEvidence({ sessionId, limit: 1 }, database)
    },
    // Await processing so serverless runtimes cannot silently discard an in-memory background task.
    analyses: {
      start: async (task) => {
        await task()
      },
      idle: async () => {},
    },
    clock: Date.now,
    random: () => randomInt(0, 1_000_000) / 1_000_000,
    newId: randomUUID,
    newToken: () => randomBytes(32).toString('hex'),
  })
}
