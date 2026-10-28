import { Prisma } from '@prisma/client'
import type { UserListRepository } from '../application/ports/user-list-repository.port'
import type { UserListQuery, UserListPage } from '../types/user-list'
import { recordUserAudit } from './user-audit'
import type { UserAuditActor } from '../types/user-audit'
import { prisma } from '@server/db/prisma'

import type { NewUser, UserRepository, UserUpdate } from '../application/ports/user-repository.port'
import type { User } from '../domain/user.entity'
import { EmailAlreadyInUseError } from '../domain/errors'
import { normalizeEmail } from '@server/shared/normalize-email'
import type { PrismaUserRecord } from '../types/prisma-user'

function toDomainUser(user: PrismaUserRecord): User {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    creci: user.creci,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    sessionVersion: user.sessionVersion,
    passwordHash: user.passwordHash,
    avatarUrl: user.avatarUrl,
    role: user.role,
    active: user.active,
    membershipApprovedAt: user.membershipApprovedAt,
    tenantStatus: user.tenant.status,
    tenantName: user.tenant.name,
    tenantSlug: user.tenant.slug,
  }
}

export class PrismaUserRepository implements UserRepository, UserListRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { tenant: { select: { status: true, name: true, slug: true } } },
    })

    return user ? toDomainUser(user) : null
  }

  async findByEmail(email: string, tenantId?: string): Promise<User | null> {
    const users = await prisma.user.findMany({
      where: { email: normalizeEmail(email), tenantId },
      include: { tenant: { select: { status: true, name: true, slug: true } } },
      take: 2,
    })
    return users.length === 1 ? toDomainUser(users[0]) : null
  }

  async findManyByEmail(email: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { email: normalizeEmail(email) },
      include: { tenant: { select: { status: true, name: true, slug: true } } },
      orderBy: { id: 'asc' },
    })
    return users.map(toDomainUser)
  }

  async findPageByTenant(tenantId: string, query: UserListQuery): Promise<UserListPage> {
    const pending = { membershipApprovedAt: null }
    const where = {
      tenantId,
      ...(query.pendingApproval === undefined
        ? {}
        : query.pendingApproval
          ? pending
          : { NOT: pending }),
    }
    const [rows, total] = await prisma.$transaction(
      [
        prisma.user.findMany({
          where,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          include: { tenant: { select: { status: true, name: true, slug: true } } },
        }),
        prisma.user.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    )
    return { users: rows.map(toDomainUser), total, page: query.page, pageSize: query.pageSize }
  }

  async findManyByTenant(tenantId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      include: { tenant: { select: { status: true, name: true, slug: true } } },
    })

    return users.map(toDomainUser)
  }

  async create(newUser: NewUser): Promise<User> {
    const user = await prisma
      .$transaction(async (tx) => {
        const created = await tx.user.create({
          include: { tenant: { select: { status: true, name: true, slug: true } } },
          data: {
            tenantId: newUser.tenantId,
            name: newUser.name,
            email: normalizeEmail(newUser.email),
            phone: newUser.phone,
            creci: newUser.creci,
            termsAcceptedAt: newUser.termsAcceptedAt,
            emailVerifiedAt: newUser.emailVerifiedAt ?? null,
            passwordHash: newUser.passwordHash,
            role: newUser.role,
            ...(newUser.membershipApprovedAt !== undefined
              ? { membershipApprovedAt: newUser.membershipApprovedAt }
              : {}),
          },
        })
        await recordUserAudit(tx, {
          userId: created.id,
          tenantId: created.tenantId,
          action: 'CREATED',
          actor: newUser.auditActor,
        })
        return created
      })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
          throw new EmailAlreadyInUseError()
        throw error
      })

    return toDomainUser(user)
  }

  async update(id: string, changes: UserUpdate): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const credentialsChanged = Boolean(changes.passwordHash || changes.email || changes.role)
      const user = await tx.user.update({
        include: { tenant: { select: { status: true, name: true, slug: true } } },
        where: { id, tenantId: changes.tenantId },
        data: {
          name: changes.name,
          email: changes.email ? normalizeEmail(changes.email) : undefined,
          avatarUrl: changes.avatarUrl,
          role: changes.role,
          passwordHash: changes.passwordHash,
          phone: changes.phone,
          creci: changes.creci,
          sessionVersion: credentialsChanged ? { increment: 1 } : undefined,
        },
      })
      if (credentialsChanged) {
        await tx.refreshToken.updateMany({
          where: { userId: id, tenantId: user.tenantId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      }
      const changedFields = [
        ...(changes.name !== undefined ? ['name'] : []),
        ...(changes.email !== undefined ? ['email'] : []),
        ...(changes.phone !== undefined ? ['phone'] : []),
        ...(changes.creci !== undefined ? ['creci'] : []),
        ...(changes.avatarUrl !== undefined ? ['avatarUrl'] : []),
        ...(changes.role !== undefined ? ['role'] : []),
        ...(changes.passwordHash !== undefined ? ['password'] : []),
      ]
      await recordUserAudit(tx, {
        userId: id,
        tenantId: user.tenantId,
        action: 'UPDATED',
        actor: changes.auditActor,
        changedFields,
      })
      return toDomainUser(user)
    })
  }

  async deactivate(id: string, tenantId?: string, actor?: UserAuditActor): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        include: { tenant: { select: { status: true, name: true, slug: true } } },
        where: { id, tenantId },
        data: { active: false, sessionVersion: { increment: 1 } },
      })
      await tx.refreshToken.updateMany({
        where: { userId: id, tenantId: user.tenantId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      await recordUserAudit(tx, {
        userId: id,
        tenantId: user.tenantId,
        action: 'DEACTIVATED',
        actor,
        changedFields: ['active'],
      })
      return toDomainUser(user)
    })
  }

  async approveMembership(id: string, tenantId?: string, actor?: UserAuditActor): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        include: { tenant: { select: { status: true, name: true, slug: true } } },
        where: { id, tenantId },
        data: { membershipApprovedAt: new Date() },
      })
      await recordUserAudit(tx, {
        userId: id,
        tenantId: user.tenantId,
        action: 'MEMBERSHIP_APPROVED',
        actor,
        changedFields: ['pendingApproval'],
      })
      return toDomainUser(user)
    })
  }
}
