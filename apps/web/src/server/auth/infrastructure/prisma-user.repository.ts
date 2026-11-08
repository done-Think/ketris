import { Prisma } from '@prisma/client'
import type { UserListRepository } from '../application/ports/user-list-repository.port'
import type { UserListQuery, UserListPage } from '../types/user-list'
import { recordUserAudit } from './user-audit'
import type { UserAuditActor } from '../types/user-audit'
import { prisma } from '@server/db/prisma'

import type { NewUser, UserRepository, UserUpdate } from '../application/ports/user-repository.port'
import type { User } from '../domain/user.entity'
import {
  CnpjAlreadyInUseError,
  CpfAlreadyInUseError,
  CreciAlreadyInUseError,
  EmailAlreadyInUseError,
  PhoneAlreadyInUseError,
} from '../domain/errors'
import { creciKey, documentKey, phoneKey } from '@server/shared/contact-keys'
import { normalizeEmail } from '@server/shared/normalize-email'
import type { PrismaUserRecord } from '../types/prisma-user'

function uniqueConflictError(error: unknown): Error | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002')
    return null
  const target = String(error.meta?.target ?? '')
  if (target.includes('phoneKey')) return new PhoneAlreadyInUseError()
  if (target.includes('creciKey')) return new CreciAlreadyInUseError()
  if (target.includes('cpf')) return new CpfAlreadyInUseError()
  if (target.includes('cnpj')) return new CnpjAlreadyInUseError()
  return new EmailAlreadyInUseError()
}

function toDomainUser(user: PrismaUserRecord): User {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    creci: user.creci,
    cpf: user.cpf,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    sessionVersion: user.sessionVersion,
    passwordHash: user.passwordHash,
    avatarUrl: user.avatarUrl,
    role: user.role,
    active: user.active,
    membershipApprovedAt: user.membershipApprovedAt,
    tenantStatus: user.tenant.status,
    tenantAccountType: user.tenant.accountType,
    tenantCnpj: user.tenant.cnpj,
    tenantName: user.tenant.name,
    tenantSlug: user.tenant.slug,
  }
}

export class PrismaUserRepository implements UserRepository, UserListRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        tenant: { select: { status: true, name: true, slug: true, accountType: true, cnpj: true } },
      },
    })

    return user ? toDomainUser(user) : null
  }

  async findByEmail(email: string, tenantId?: string): Promise<User | null> {
    const users = await prisma.user.findMany({
      where: { email: normalizeEmail(email), tenantId },
      include: {
        tenant: { select: { status: true, name: true, slug: true, accountType: true, cnpj: true } },
      },
      take: 2,
    })
    return users.length === 1 ? toDomainUser(users[0]) : null
  }

  async findManyByEmail(email: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { email: normalizeEmail(email) },
      include: {
        tenant: { select: { status: true, name: true, slug: true, accountType: true, cnpj: true } },
      },
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
          include: {
            tenant: {
              select: { status: true, name: true, slug: true, accountType: true, cnpj: true },
            },
          },
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
      include: {
        tenant: { select: { status: true, name: true, slug: true, accountType: true, cnpj: true } },
      },
    })

    return users.map(toDomainUser)
  }

  async create(newUser: NewUser): Promise<User> {
    const user = await prisma
      .$transaction(async (tx) => {
        const created = await tx.user.create({
          include: {
            tenant: {
              select: { status: true, name: true, slug: true, accountType: true, cnpj: true },
            },
          },
          data: {
            tenantId: newUser.tenantId,
            name: newUser.name,
            email: normalizeEmail(newUser.email),
            phone: newUser.phone,
            phoneKey: phoneKey(newUser.phone),
            creci: newUser.creci,
            creciKey: creciKey(newUser.creci),
            cpf: documentKey(newUser.cpf),
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
        throw uniqueConflictError(error) ?? error
      })

    return toDomainUser(user)
  }

  async update(id: string, changes: UserUpdate): Promise<User> {
    return prisma
      .$transaction(async (tx) => {
        const credentialsChanged = Boolean(changes.passwordHash || changes.email || changes.role)
        const user = await tx.user.update({
          include: {
            tenant: {
              select: { status: true, name: true, slug: true, accountType: true, cnpj: true },
            },
          },
          where: { id, tenantId: changes.tenantId },
          data: {
            name: changes.name,
            email: changes.email ? normalizeEmail(changes.email) : undefined,
            avatarUrl: changes.avatarUrl,
            role: changes.role,
            passwordHash: changes.passwordHash,
            phone: changes.phone,
            ...(changes.phone !== undefined ? { phoneKey: phoneKey(changes.phone) } : {}),
            creci: changes.creci,
            ...(changes.creci !== undefined ? { creciKey: creciKey(changes.creci) } : {}),
            ...(changes.cpf !== undefined ? { cpf: documentKey(changes.cpf) } : {}),
            sessionVersion: credentialsChanged ? { increment: 1 } : undefined,
          },
        })
        if (changes.cnpj !== undefined) {
          const cnpj = documentKey(changes.cnpj)
          await tx.tenant.update({ where: { id: user.tenantId }, data: { cnpj } })
          user.tenant.cnpj = cnpj
        }
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
          ...(changes.cpf !== undefined ? ['cpf'] : []),
          ...(changes.cnpj !== undefined ? ['cnpj'] : []),
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
      .catch((error: unknown) => {
        throw uniqueConflictError(error) ?? error
      })
  }

  async deactivate(id: string, tenantId?: string, actor?: UserAuditActor): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        include: {
          tenant: {
            select: { status: true, name: true, slug: true, accountType: true, cnpj: true },
          },
        },
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
        include: {
          tenant: {
            select: { status: true, name: true, slug: true, accountType: true, cnpj: true },
          },
        },
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
