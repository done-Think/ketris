import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { PrismaPlatformRefreshTokenRepository } from '../../infrastructure/prisma-platform-refresh-token.repository'
import { PrismaPlatformAdminRepository } from '../../infrastructure/prisma-platform-admin.repository'
import { DeactivatePlatformAdminUseCase } from '../../application/use-cases/deactivate-platform-admin.use-case'

describe('atomic platform refresh-token rotation', () => {
  const repository = new PrismaPlatformRefreshTokenRepository()
  let platformAdminId: string

  beforeAll(async () => {
    const admin = await prisma.platformAdmin.create({
      data: {
        name: 'Platform rotation test',
        email: `rotation-${randomUUID()}@example.test`,
        passwordHash: 'test-hash',
      },
    })
    platformAdminId = admin.id
  })

  afterAll(async () => {
    await prisma.platformAdminRefreshToken.deleteMany({ where: { platformAdminId } })
    await prisma.platformAdmin.delete({ where: { id: platformAdminId } })
    await prisma.$disconnect()
  })

  it('allows exactly one replacement across concurrent attempts', async () => {
    const tokenHash = `original-${randomUUID()}`
    await repository.create({
      platformAdminId,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    })
    const previous = (await repository.findValidByTokenHash(tokenHash))!
    const replacements = Array.from({ length: 8 }, () => ({
      platformAdminId,
      tokenHash: `new-${randomUUID()}`,
      expiresAt: new Date(Date.now() + 60_000),
    }))

    const results = await Promise.all(
      replacements.map((replacement) => repository.rotate({ previous, replacement })),
    )
    expect(results.filter(Boolean)).toHaveLength(1)
    expect(await repository.findValidByTokenHash(tokenHash)).toBeNull()
    expect(
      await prisma.platformAdminRefreshToken.count({
        where: { tokenHash: { in: replacements.map((replacement) => replacement.tokenHash) } },
      }),
    ).toBe(1)
  })

  it('preserves the original token when replacement creation fails', async () => {
    const tokenHash = `rollback-original-${randomUUID()}`
    const collisionHash = `collision-${randomUUID()}`
    const expiresAt = new Date(Date.now() + 60_000)
    await repository.create({ platformAdminId, tokenHash, expiresAt })
    await repository.create({ platformAdminId, tokenHash: collisionHash, expiresAt })
    const previous = (await repository.findValidByTokenHash(tokenHash))!

    await expect(
      repository.rotate({
        previous,
        replacement: { platformAdminId, tokenHash: collisionHash, expiresAt },
      }),
    ).rejects.toThrow()
    expect(await repository.findValidByTokenHash(tokenHash)).toEqual(previous)
  })

  it('does not rotate expired tokens or tokens bound to a different administrator', async () => {
    const tokenHash = `guard-${randomUUID()}`
    const expiresAt = new Date(Date.now() + 60_000)
    await repository.create({ platformAdminId, tokenHash, expiresAt })
    const previous = (await repository.findValidByTokenHash(tokenHash))!
    const replacement = { platformAdminId, tokenHash: `new-${randomUUID()}`, expiresAt }

    expect(
      await repository.rotate({
        previous: { ...previous, platformAdminId: 'foreign-admin' },
        replacement,
      }),
    ).toBe(false)
    await prisma.platformAdminRefreshToken.update({
      where: { id: previous.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    })
    expect(await repository.rotate({ previous, replacement })).toBe(false)
    expect(await repository.findValidByTokenHash(replacement.tokenHash)).toBeNull()
  })

  it('serializes administrator deactivation and rotation without leaving an active descendant', async () => {
    const actor = await prisma.platformAdmin.create({
      data: {
        name: 'Rotation manager',
        email: `rotation-manager-${randomUUID()}@example.test`,
        passwordHash: 'unused',
        role: 'ADMIN',
      },
    })
    const tokenHash = `deactivate-race-${randomUUID()}`
    await repository.create({
      platformAdminId,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    })
    const previous = (await repository.findValidByTokenHash(tokenHash))!
    let signalLocked = () => {}
    let releaseLock = () => {}
    const locked = new Promise<void>((resolve) => {
      signalLocked = resolve
    })
    const release = new Promise<void>((resolve) => {
      releaseLock = resolve
    })
    const blocker = prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "platform_admins" WHERE "id" = ${platformAdminId} FOR UPDATE`
      signalLocked()
      await release
    })

    try {
      await locked
      const rotation = repository.rotate({
        previous,
        replacement: {
          platformAdminId,
          tokenHash: `raced-child-${randomUUID()}`,
          expiresAt: new Date(Date.now() + 60_000),
        },
      })
      const deactivation = new DeactivatePlatformAdminUseCase(
        new PrismaPlatformAdminRepository(),
      ).execute({
        actorId: actor.id,
        platformAdminId,
      })
      releaseLock()
      await blocker
      await Promise.all([rotation, deactivation])
      expect(
        await prisma.platformAdminRefreshToken.count({
          where: { platformAdminId, revokedAt: null },
        }),
      ).toBe(0)
      expect(
        await repository.rotate({
          previous,
          replacement: {
            platformAdminId,
            tokenHash: `inactive-child-${randomUUID()}`,
            expiresAt: new Date(Date.now() + 60_000),
          },
        }),
      ).toBe(false)
    } finally {
      releaseLock()
      await blocker
      await prisma.platformAdmin.delete({ where: { id: actor.id } })
    }
  })
})
