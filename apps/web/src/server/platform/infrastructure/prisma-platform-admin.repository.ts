import type { PlatformAdmin as PrismaPlatformAdmin, Prisma, PrismaClient } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import { ForbiddenError, UnauthorizedError } from '@server/shared/errors'

import { CannotDeactivateSelfError, PlatformAdminEmailAlreadyInUseError } from '../domain/errors'
import { assertActiveAdministratorRemains } from '../domain/platform-admin-policy'

import type { PlatformAdminRepository } from '../application/ports/platform-admin-repository.port'
import type { NewPlatformAdmin, PlatformAdminUpdate } from '../types/platform-admin-repository'
import type { PlatformAdmin } from '../types/platform-admin'

function toDomainPlatformAdmin(admin: PrismaPlatformAdmin): PlatformAdmin {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    passwordHash: admin.passwordHash,
    role: admin.role,
    active: admin.active,
    createdAt: admin.createdAt,
    lastAccessAt: admin.lastAccessAt,
  }
}

export class PrismaPlatformAdminRepository implements PlatformAdminRepository {
  constructor(private readonly database: PrismaClient = prisma) {}
  async findById(id: string): Promise<PlatformAdmin | null> {
    const admin = await this.database.platformAdmin.findUnique({ where: { id } })

    return admin ? toDomainPlatformAdmin(admin) : null
  }

  async findByEmail(email: string): Promise<PlatformAdmin | null> {
    const admin = await this.database.platformAdmin.findUnique({ where: { email } })

    return admin ? toDomainPlatformAdmin(admin) : null
  }

  async findMany(): Promise<PlatformAdmin[]> {
    const admins = await this.database.platformAdmin.findMany({ orderBy: { createdAt: 'asc' } })

    return admins.map(toDomainPlatformAdmin)
  }

  async create(newAdmin: NewPlatformAdmin, actorId: string): Promise<PlatformAdmin> {
    return this.database.$transaction(async (tx) => {
      await lockAdministration(tx, actorId)
      const existing = await tx.platformAdmin.findUnique({ where: { email: newAdmin.email } })
      if (existing) throw new PlatformAdminEmailAlreadyInUseError()
      return toDomainPlatformAdmin(await tx.platformAdmin.create({ data: newAdmin }))
    })
  }

  async update(
    id: string,
    changes: PlatformAdminUpdate,
    actorId: string,
  ): Promise<PlatformAdmin | null> {
    return this.database.$transaction(async (tx) => {
      await lockAdministration(tx, actorId, id)
      const target = await tx.platformAdmin.findUnique({ where: { id } })
      if (!target) return null
      const activeAdminCount = await tx.platformAdmin.count({
        where: { active: true, role: 'ADMIN' },
      })
      assertActiveAdministratorRemains(target, changes, activeAdminCount)
      if (changes.email && changes.email !== target.email) {
        const existing = await tx.platformAdmin.findUnique({ where: { email: changes.email } })
        if (existing) throw new PlatformAdminEmailAlreadyInUseError()
      }
      const updated = await tx.platformAdmin.update({ where: { id }, data: changes })
      if (updated.role !== target.role) {
        await tx.platformAdminRefreshToken.updateMany({
          where: { platformAdminId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      }
      return toDomainPlatformAdmin(updated)
    })
  }

  async deactivate(id: string, actorId: string): Promise<PlatformAdmin | null> {
    return this.database.$transaction(async (tx) => {
      await lockAdministration(tx, actorId, id)
      if (actorId === id) throw new CannotDeactivateSelfError()
      const target = await tx.platformAdmin.findUnique({ where: { id } })
      if (!target) return null
      const activeAdminCount = await tx.platformAdmin.count({
        where: { active: true, role: 'ADMIN' },
      })
      assertActiveAdministratorRemains(target, { active: false }, activeAdminCount)
      const updated = await tx.platformAdmin.update({ where: { id }, data: { active: false } })
      await tx.platformAdminRefreshToken.updateMany({
        where: { platformAdminId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      return toDomainPlatformAdmin(updated)
    })
  }

  async recordAccess(id: string, at: Date): Promise<void> {
    await this.database.platformAdmin.updateMany({ where: { id }, data: { lastAccessAt: at } })
  }
}

async function lockAdministration(
  tx: Prisma.TransactionClient,
  actorId: string,
  targetId = actorId,
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(704221, 1)`
  await tx.$queryRaw`
    SELECT "id" FROM "platform_admins"
    WHERE "id" IN (${actorId}, ${targetId}) ORDER BY "id" FOR UPDATE
  `
  const actor = await tx.platformAdmin.findUnique({ where: { id: actorId } })
  if (!actor?.active) throw new UnauthorizedError()
  if (actor.role !== 'ADMIN') throw new ForbiddenError()
}
