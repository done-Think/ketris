import type { Prisma } from '@prisma/client'
import { resolveFaceCheckActor } from '../require-face-check-actor'
import { FaceCheckError } from '../http/errors'
import type { FaceCheckActor, FaceCheckDatabase, FaceCheckScope } from '../types/access'
import { captureTokenHash } from './data-cipher'

const eligibleUser = {
  active: true,
  emailVerifiedAt: { not: null },
  membershipApprovedAt: { not: null },
  role: { in: ['OWNER', 'AGENT'] as ('OWNER' | 'AGENT')[] },
  tenant: {
    status: { in: ['ACTIVE', 'TRIAL'] as ('ACTIVE' | 'TRIAL')[] },
    accountType: { in: ['AGENCY', 'BROKER'] as ('AGENCY' | 'BROKER')[] },
  },
}

export class FaceCheckAccessScope {
  constructor(
    readonly database: FaceCheckDatabase,
    readonly scope: FaceCheckScope,
  ) {}

  async actor(): Promise<FaceCheckActor> {
    if (!('actor' in this.scope)) throw new FaceCheckError('FORBIDDEN', 403)
    return resolveFaceCheckActor(
      { userId: this.scope.actor.actorId, tenantId: this.scope.actor.tenantId },
      this.database,
    )
  }

  async sessionsWhere(): Promise<Prisma.FaceCheckSessionWhereInput> {
    if ('actor' in this.scope) {
      const actor = await this.actor()
      return {
        tenantId: actor.tenantId,
        ...(actor.role === 'AGENT'
          ? { property: { tenantId: actor.tenantId, responsibleId: actor.actorId } }
          : {}),
      }
    }
    return { tokenHash: captureTokenHash(this.scope.token), requestedBy: eligibleUser }
  }

  async publicSessionWhere(requestedById: string): Promise<Prisma.FaceCheckSessionWhereInput> {
    return {
      ...(await this.sessionsWhere()),
      expiresAt: { gt: new Date() },
      OR: [
        { requestedBy: { ...eligibleUser, role: 'OWNER' } },
        {
          requestedBy: { ...eligibleUser, role: 'AGENT' },
          property: { responsibleId: requestedById },
        },
      ],
    }
  }

  async property(propertyId: string) {
    const actor = await this.actor()
    const property = await this.database.property.findFirst({
      where: {
        id: propertyId,
        tenantId: actor.tenantId,
        ...(actor.role === 'AGENT' ? { responsibleId: actor.actorId } : {}),
      },
      select: { id: true },
    })
    if (!property) throw new FaceCheckError('SESSION_NOT_FOUND', 404)
    return actor
  }

  async settings(write = false): Promise<{ tenantId: string; agencyName: string }> {
    if ('actor' in this.scope) {
      const actor = await this.actor()
      if (write && actor.role !== 'OWNER') throw new FaceCheckError('FORBIDDEN', 403)
      if (actor.role === 'AGENT') {
        await this.database.property.findFirst({
          where: { tenantId: actor.tenantId, responsibleId: actor.actorId },
          select: { id: true },
        })
      }
      return { tenantId: actor.tenantId, agencyName: actor.agencyName }
    }
    const row = await this.database.faceCheckSession.findFirst({
      where: await this.sessionsWhere(),
      select: {
        requestedById: true,
        tenantId: true,
        expiresAt: true,
        requestedBy: { select: { role: true } },
        property: { select: { responsibleId: true } },
        tenant: { select: { name: true } },
      },
    })
    if (
      !row ||
      (row.requestedBy.role === 'AGENT' && row.property.responsibleId !== row.requestedById)
    )
      throw new FaceCheckError('SESSION_NOT_FOUND', 404)
    if (row.expiresAt.getTime() <= Date.now()) throw new FaceCheckError('SESSION_EXPIRED', 410)
    if (write) throw new FaceCheckError('FORBIDDEN', 403)
    return { tenantId: row.tenantId, agencyName: row.tenant.name }
  }
}
