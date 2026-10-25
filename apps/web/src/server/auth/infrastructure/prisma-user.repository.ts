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

function toDomainUser(usuario: PrismaUserRecord): User {
  return {
    id: usuario.id,
    tenantId: usuario.tenantId,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
    creci: usuario.creci,
    emailVerifiedAt: usuario.emailVerificadoEm ?? null,
    sessionVersion: usuario.versaoSessao,
    senhaHash: usuario.senhaHash,
    avatarUrl: usuario.avatarUrl,
    papel: usuario.papel,
    ativo: usuario.ativo,
    vinculoAprovadoEm: usuario.vinculoAprovadoEm,
    tenantStatus: usuario.tenant.status,
    tenantName: usuario.tenant.nome,
    tenantSlug: usuario.tenant.slug,
  }
}

export class PrismaUserRepository implements UserRepository, UserListRepository {
  async findById(id: string): Promise<User | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: { tenant: { select: { status: true, nome: true, slug: true } } },
    })

    return usuario ? toDomainUser(usuario) : null
  }

  async findByEmail(email: string, tenantId?: string): Promise<User | null> {
    const usuarios = await prisma.usuario.findMany({
      where: { email: normalizeEmail(email), tenantId },
      include: { tenant: { select: { status: true, nome: true, slug: true } } },
      take: 2,
    })
    return usuarios.length === 1 ? toDomainUser(usuarios[0]) : null
  }

  async findManyByEmail(email: string): Promise<User[]> {
    const usuarios = await prisma.usuario.findMany({
      where: { email: normalizeEmail(email) },
      include: { tenant: { select: { status: true, nome: true, slug: true } } },
      orderBy: { id: 'asc' },
    })
    return usuarios.map(toDomainUser)
  }

  async findPageByTenant(tenantId: string, query: UserListQuery): Promise<UserListPage> {
    const pending = { vinculoAprovadoEm: null }
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
        prisma.usuario.findMany({
          where,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          include: { tenant: { select: { status: true, nome: true, slug: true } } },
        }),
        prisma.usuario.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    )
    return { users: rows.map(toDomainUser), total, page: query.page, pageSize: query.pageSize }
  }

  async findManyByTenant(tenantId: string): Promise<User[]> {
    const usuarios = await prisma.usuario.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      include: { tenant: { select: { status: true, nome: true, slug: true } } },
    })

    return usuarios.map(toDomainUser)
  }

  async create(newUser: NewUser): Promise<User> {
    const usuario = await prisma
      .$transaction(async (tx) => {
        const created = await tx.usuario.create({
          include: { tenant: { select: { status: true, nome: true, slug: true } } },
          data: {
            tenantId: newUser.tenantId,
            nome: newUser.nome,
            email: normalizeEmail(newUser.email),
            telefone: newUser.telefone,
            creci: newUser.creci,
            termosAceitosEm: newUser.termosAceitosEm,
            emailVerificadoEm: newUser.emailVerifiedAt ?? null,
            senhaHash: newUser.senhaHash,
            papel: newUser.papel,
            ...(newUser.vinculoAprovadoEm !== undefined
              ? { vinculoAprovadoEm: newUser.vinculoAprovadoEm }
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

    return toDomainUser(usuario)
  }

  async update(id: string, changes: UserUpdate): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const credentialsChanged = Boolean(changes.senhaHash || changes.email || changes.papel)
      const usuario = await tx.usuario.update({
        include: { tenant: { select: { status: true, nome: true, slug: true } } },
        where: { id, tenantId: changes.tenantId },
        data: {
          nome: changes.nome,
          email: changes.email ? normalizeEmail(changes.email) : undefined,
          avatarUrl: changes.avatarUrl,
          papel: changes.papel,
          senhaHash: changes.senhaHash,
          telefone: changes.telefone,
          creci: changes.creci,
          versaoSessao: credentialsChanged ? { increment: 1 } : undefined,
        },
      })
      if (credentialsChanged) {
        await tx.refreshToken.updateMany({
          where: { userId: id, tenantId: usuario.tenantId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      }
      const changedFields = [
        ...(changes.nome !== undefined ? ['name'] : []),
        ...(changes.email !== undefined ? ['email'] : []),
        ...(changes.telefone !== undefined ? ['phone'] : []),
        ...(changes.creci !== undefined ? ['creci'] : []),
        ...(changes.avatarUrl !== undefined ? ['avatarUrl'] : []),
        ...(changes.papel !== undefined ? ['role'] : []),
        ...(changes.senhaHash !== undefined ? ['password'] : []),
      ]
      await recordUserAudit(tx, {
        userId: id,
        tenantId: usuario.tenantId,
        action: 'UPDATED',
        actor: changes.auditActor,
        changedFields,
      })
      return toDomainUser(usuario)
    })
  }

  async deactivate(id: string, tenantId?: string, actor?: UserAuditActor): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        include: { tenant: { select: { status: true, nome: true, slug: true } } },
        where: { id, tenantId },
        data: { ativo: false, versaoSessao: { increment: 1 } },
      })
      await tx.refreshToken.updateMany({
        where: { userId: id, tenantId: usuario.tenantId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      await recordUserAudit(tx, {
        userId: id,
        tenantId: usuario.tenantId,
        action: 'DEACTIVATED',
        actor,
        changedFields: ['active'],
      })
      return toDomainUser(usuario)
    })
  }

  async approveMembership(id: string, tenantId?: string, actor?: UserAuditActor): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        include: { tenant: { select: { status: true, nome: true, slug: true } } },
        where: { id, tenantId },
        data: { vinculoAprovadoEm: new Date() },
      })
      await recordUserAudit(tx, {
        userId: id,
        tenantId: usuario.tenantId,
        action: 'MEMBERSHIP_APPROVED',
        actor,
        changedFields: ['pendingApproval'],
      })
      return toDomainUser(usuario)
    })
  }
}
