import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { PrismaRefreshTokenRepository } from '../../infrastructure/prisma-refresh-token.repository'
import { PrismaPasswordResetAccountRepository } from '../../infrastructure/prisma-password-reset-account.repository'

describe('PrismaRefreshTokenRepository (integração)', () => {
  const repository = new PrismaRefreshTokenRepository()
  const tenantSlug = `test-tenant-${randomUUID()}`
  let tenantId: string
  let userId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Refresh Token', slug: tenantSlug },
    })
    tenantId = tenant.id

    const usuario = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Usuário Refresh Token',
        email: `usuario-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'OWNER',
      },
    })
    userId = usuario.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('cria e encontra um refresh token válido pelo hash', async () => {
    const tokenHash = `hash-${randomUUID()}`

    await repository.create({
      userId,
      tenantId,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    })

    const found = await repository.findValidByTokenHash(tokenHash)

    expect(found?.userId).toBe(userId)
    expect(found?.tenantId).toBe(tenantId)
  })

  it('retorna null para um hash que não existe', async () => {
    const found = await repository.findValidByTokenHash('hash-inexistente')

    expect(found).toBeNull()
  })

  it('retorna null para um token expirado', async () => {
    const tokenHash = `hash-expirado-${randomUUID()}`

    await repository.create({
      userId,
      tenantId,
      tokenHash,
      expiresAt: new Date(Date.now() - 60_000),
    })

    const found = await repository.findValidByTokenHash(tokenHash)

    expect(found).toBeNull()
  })

  it('retorna null para um token revogado', async () => {
    const tokenHash = `hash-revogado-${randomUUID()}`

    await repository.create({
      userId,
      tenantId,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    })

    const beforeRevoke = await repository.findValidByTokenHash(tokenHash)
    await repository.revokeById(beforeRevoke!.id)

    const afterRevoke = await repository.findValidByTokenHash(tokenHash)

    expect(afterRevoke).toBeNull()
  })

  it('consumes a refresh token once across concurrent rotations', async () => {
    const tokenHash = `old-${randomUUID()}`
    await repository.create({
      userId,
      tenantId,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    })
    const previous = (await repository.findValidByTokenHash(tokenHash))!
    const replacements = Array.from({ length: 8 }, () => ({
      userId,
      tenantId,
      tokenHash: `replacement-${randomUUID()}`,
      expiresAt: new Date(Date.now() + 60_000),
    }))

    const results = await Promise.all(
      replacements.map((replacement) =>
        repository.rotate({ expectedSessionVersion: 0, previous, replacement }),
      ),
    )
    expect(results.filter(Boolean)).toHaveLength(1)
    expect(await repository.findValidByTokenHash(tokenHash)).toBeNull()
    expect(
      await prisma.refreshToken.count({
        where: { tokenHash: { in: replacements.map((replacement) => replacement.tokenHash) } },
      }),
    ).toBe(1)
  })

  it('rolls back consumption when creating the replacement fails', async () => {
    const tokenHash = `rollback-old-${randomUUID()}`
    const collisionHash = `collision-${randomUUID()}`
    const expiresAt = new Date(Date.now() + 60_000)
    await repository.create({ userId, tenantId, tokenHash, expiresAt })
    await repository.create({ userId, tenantId, tokenHash: collisionHash, expiresAt })
    const previous = (await repository.findValidByTokenHash(tokenHash))!

    await expect(
      repository.rotate({
        expectedSessionVersion: 0,
        previous,
        replacement: { userId, tenantId, tokenHash: collisionHash, expiresAt },
      }),
    ).rejects.toThrow()
    expect(await repository.findValidByTokenHash(tokenHash)).toEqual(previous)
  })

  it('does not rotate tokens that expired after lookup or belong to another tenant', async () => {
    const tokenHash = `guard-${randomUUID()}`
    const expiresAt = new Date(Date.now() + 60_000)
    await repository.create({ userId, tenantId, tokenHash, expiresAt })
    const previous = (await repository.findValidByTokenHash(tokenHash))!
    const replacement = { userId, tenantId, tokenHash: `new-${randomUUID()}`, expiresAt }

    expect(
      await repository.rotate({
        expectedSessionVersion: 0,
        previous: { ...previous, tenantId: 'foreign-tenant' },
        replacement,
      }),
    ).toBe(false)
    await prisma.refreshToken.update({
      where: { id: previous.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    })
    expect(await repository.rotate({ expectedSessionVersion: 0, previous, replacement })).toBe(
      false,
    )
    expect(await repository.findValidByTokenHash(replacement.tokenHash)).toBeNull()
  })

  it('checks the current account version and active state while holding its lock', async () => {
    const tokenHash = `version-guard-${randomUUID()}`
    const user = await prisma.usuario.findUniqueOrThrow({ where: { id: userId } })
    await repository.create({
      userId,
      tenantId,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    })
    const previous = (await repository.findValidByTokenHash(tokenHash))!
    const replacement = {
      userId,
      tenantId,
      tokenHash: `new-${randomUUID()}`,
      expiresAt: new Date(Date.now() + 60_000),
    }

    try {
      await prisma.usuario.update({
        where: { id: userId },
        data: { versaoSessao: user.versaoSessao + 1 },
      })
      expect(
        await repository.rotate({
          previous,
          replacement,
          expectedSessionVersion: user.versaoSessao,
        }),
      ).toBe(false)
      expect(await repository.findValidByTokenHash(tokenHash)).toEqual(previous)
      await prisma.usuario.update({ where: { id: userId }, data: { ativo: false } })
      expect(
        await repository.rotate({
          previous,
          replacement,
          expectedSessionVersion: user.versaoSessao + 1,
        }),
      ).toBe(false)
      expect(await repository.findValidByTokenHash(replacement.tokenHash)).toBeNull()
    } finally {
      await prisma.usuario.update({
        where: { id: userId },
        data: { ativo: user.ativo, versaoSessao: user.versaoSessao },
      })
    }
  })

  it('serializes refresh and password reset under a user-row barrier so no old-session descendant survives', async () => {
    const tokenHash = `reset-race-${randomUUID()}`
    await repository.create({
      userId,
      tenantId,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    })
    const previous = (await repository.findValidByTokenHash(tokenHash))!
    const user = await prisma.usuario.findUniqueOrThrow({ where: { id: userId } })
    let signalLocked = () => {}
    let releaseLock = () => {}
    const locked = new Promise<void>((resolve) => {
      signalLocked = resolve
    })
    const release = new Promise<void>((resolve) => {
      releaseLock = resolve
    })
    const blocker = prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "usuarios" WHERE "id" = ${userId} FOR UPDATE`
      signalLocked()
      await release
    })

    try {
      await locked
      const rotation = repository.rotate({
        previous,
        expectedSessionVersion: user.versaoSessao,
        replacement: {
          userId,
          tenantId,
          tokenHash: `raced-child-${randomUUID()}`,
          expiresAt: new Date(Date.now() + 60_000),
        },
      })
      const reset = new PrismaPasswordResetAccountRepository().resetPassword({
        userId,
        tenantId,
        email: user.email,
        sessionVersion: user.versaoSessao,
        passwordHash: 'new-test-hash',
      })
      releaseLock()
      await blocker
      const [, changed] = await Promise.all([rotation, reset])
      expect(changed).toBe(true)
      expect(await prisma.refreshToken.count({ where: { userId, revokedAt: null } })).toBe(0)
      expect(
        await repository.rotate({
          previous,
          expectedSessionVersion: user.versaoSessao,
          replacement: {
            userId,
            tenantId,
            tokenHash: `stale-child-${randomUUID()}`,
            expiresAt: new Date(Date.now() + 60_000),
          },
        }),
      ).toBe(false)
    } finally {
      releaseLock()
      await blocker
    }
  })
})
