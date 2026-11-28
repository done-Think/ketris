import { randomUUID } from 'node:crypto'
import { prisma } from '@server/db/prisma'
import { InstagramError } from '../domain/errors'
import type { InstagramRepository } from '../application/ports/instagram-repository.port'
import type {
  InstagramConnection,
  InstagramPublication,
  InstagramPublicationPatch,
  InstagramState,
  NewInstagramPublication,
} from '../types/instagram'

export class PrismaInstagramRepository implements InstagramRepository {
  async saveState(state: InstagramState) {
    await prisma.instagramOAuthState.create({ data: state })
  }
  async consumeState(hash: string, verifierHash: string, tenantId: string, actorId: string) {
    return (
      (
        await prisma.instagramOAuthState.deleteMany({
          where: { hash, verifierHash, tenantId, actorId, expiresAt: { gt: new Date() } },
        })
      ).count === 1
    )
  }
  async actor(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        active: true,
        emailVerifiedAt: { not: null },
        tenant: { status: { in: ['ACTIVE', 'TRIAL'] } },
        OR: [{ role: { not: 'AGENT' } }, { membershipApprovedAt: { not: null } }],
      },
      select: { id: true, tenantId: true, role: true },
    })
    return user ? { id: user.id, tenantId: user.tenantId, role: user.role } : null
  }
  connection(tenantId: string, userId: string) {
    return prisma.instagramConnection.findUnique({
      where: { tenantId_connectedBy: { tenantId, connectedBy: userId } },
    })
  }
  async saveConnection(connection: InstagramConnection) {
    try {
      await prisma.instagramConnection.upsert({
        where: {
          tenantId_connectedBy: {
            tenantId: connection.tenantId,
            connectedBy: connection.connectedBy,
          },
        },
        create: connection,
        update: connection,
      })
    } catch {
      throw new InstagramError(
        'INSTAGRAM_CONNECTION_CONFLICT',
        'Essa conta já está conectada ou houve uma alteração simultânea. Tente novamente.',
        409,
      )
    }
  }
  async disconnect(tenantId: string, userId: string) {
    await prisma.$transaction([
      prisma.instagramConnection.deleteMany({ where: { tenantId, connectedBy: userId } }),
      prisma.instagramOAuthState.deleteMany({ where: { tenantId, actorId: userId } }),
      prisma.instagramPublication.updateMany({
        where: {
          tenantId,
          requestedBy: userId,
          status: { in: ['QUEUED', 'PREPARING', 'READY', 'FAILED'] },
        },
        data: {
          status: 'CANCELLED',
          leaseToken: null,
          lockedUntil: null,
        },
      }),
    ])
  }
  async refreshConnection(connection: InstagramConnection) {
    return (
      (
        await prisma.instagramConnection.updateMany({
          where: {
            tenantId: connection.tenantId,
            connectedBy: connection.connectedBy,
            accountId: connection.accountId,
            revision: connection.revision,
          },
          data: {
            encryptedToken: connection.encryptedToken,
            expiresAt: connection.expiresAt,
            refreshedAt: connection.refreshedAt,
          },
        })
      ).count === 1
    )
  }
  async deleteByOAuthUser(oauthUserId: string) {
    const connection = await prisma.instagramConnection.findUnique({ where: { oauthUserId } })
    await prisma.$transaction([
      prisma.instagramConnection.deleteMany({
        where: { oauthUserId },
      }),
      prisma.instagramPublication.deleteMany({
        where: { oauthUserId },
      }),
      ...(connection
        ? [
            prisma.instagramOAuthState.deleteMany({
              where: { tenantId: connection.tenantId, actorId: connection.connectedBy },
            }),
          ]
        : []),
    ])
  }
  expiringConnections() {
    return prisma.instagramConnection.findMany({
      where: {
        expiresAt: { gt: new Date(), lt: new Date(Date.now() + 7 * 86400_000) },
        refreshedAt: { lt: new Date(Date.now() - 86400_000) },
      },
      take: 10,
    })
  }
  async property(tenantId: string, id: string) {
    const property = await prisma.property.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        responsibleId: true,
        ownerId: true,
        status: true,
        media: { select: { url: true } },
      },
    })
    return property
      ? {
          id: property.id,
          tenantId: property.tenantId,
          responsibleId: property.responsibleId,
          ownerId: property.ownerId,
          status: property.status,
          mediaUrls: property.media.map((m) => m.url),
        }
      : null
  }
  async deletionMediaKeys(oauthUserId: string) {
    const jobs = await prisma.instagramPublication.findMany({
      where: { oauthUserId },
      select: { id: true, tenantId: true },
    })
    return jobs.flatMap((job) =>
      Array.from(
        { length: 20 },
        (_, index) => `properties/${job.tenantId}/instagram/${job.id}/${index}.jpg`,
      ),
    )
  }
  async enqueue(input: NewInstagramPublication) {
    const job = await prisma.instagramPublication.upsert({
      where: { dedupeKey: input.dedupeKey },
      create: input,
      update: {},
    })
    if (job.requestedBy !== input.requestedBy)
      throw new InstagramError(
        'INSTAGRAM_ACCOUNT_ALREADY_USED',
        'Este imóvel já tem um envio nesta conta Instagram.',
        409,
      )
    if (job.status !== 'FAILED' && job.status !== 'CANCELLED') return job
    await prisma.instagramPublication.updateMany({
      where: {
        id: job.id,
        requestedBy: input.requestedBy,
        status: { in: ['FAILED', 'CANCELLED'] },
      },
      data: {
        caption: input.caption,
        imageUrls: input.imageUrls,
        connectionRevision: input.connectionRevision,
        status: 'QUEUED',
        attempts: 0,
        containerId: null,
        preparedKeys: [],
        lastErrorCode: null,
        nextAttemptAt: new Date(),
      },
    })
    return prisma.instagramPublication.findUniqueOrThrow({ where: { id: job.id } })
  }
  publications(tenantId: string, propertyId: string, userId: string) {
    return prisma.instagramPublication.findMany({
      where: { tenantId, propertyId, requestedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
  }
  publication(id: string) {
    return prisma.instagramPublication.findUnique({ where: { id } })
  }
  async claim(id?: string) {
    const now = new Date()
    const where = {
      id,
      status: {
        in: [
          'QUEUED',
          'PREPARING',
          'READY',
          'PUBLISHING',
          'VERIFYING',
        ] as InstagramPublication['status'][],
      },
      nextAttemptAt: { lte: now },
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
    }
    const job = await prisma.instagramPublication.findFirst({
      where,
      orderBy: { nextAttemptAt: 'asc' },
    })
    if (!job) return null
    const leaseToken = randomUUID()
    const updated = await prisma.instagramPublication.updateMany({
      where: { ...where, id: job.id },
      data: {
        leaseToken,
        lockedUntil: new Date(Date.now() + 10 * 60_000),
        attempts: { increment: 1 },
      },
    })
    return updated.count ? { ...job, leaseToken, attempts: job.attempts + 1 } : null
  }
  async patch(job: InstagramPublication, patch: InstagramPublicationPatch) {
    const result = await prisma.instagramPublication.updateMany({
      where: {
        id: job.id,
        tenantId: job.tenantId,
        leaseToken: job.leaseToken,
        status: { not: 'CANCELLED' },
      },
      data: patch,
    })
    if (!result.count) throw new InstagramError('INSTAGRAM_LEASE_LOST', undefined, 409)
    Object.assign(job, patch)
  }
  async release(job: InstagramPublication) {
    await prisma.instagramPublication.updateMany({
      where: { id: job.id, leaseToken: job.leaseToken },
      data: { leaseToken: null, lockedUntil: null },
    })
  }
  async retry(tenantId: string, userId: string, id: string) {
    const connection = await this.connection(tenantId, userId)
    if (!connection || connection.expiresAt.getTime() <= Date.now()) return false
    return (
      (
        await prisma.instagramPublication.updateMany({
          where: {
            id,
            tenantId,
            requestedBy: userId,
            accountId: connection.accountId,
            status: 'FAILED',
          },
          data: {
            status: 'QUEUED',
            attempts: 0,
            connectionRevision: connection.revision,
            containerId: null,
            nextAttemptAt: new Date(),
            lastErrorCode: null,
          },
        })
      ).count === 1
    )
  }
  async cleanupStates() {
    await prisma.instagramOAuthState.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  }
}
