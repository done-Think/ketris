import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '@server/db/prisma'

import { hashPasswordResetCode } from '../../domain/password-reset-code'
import { PrismaEmailOwnershipCodeRepository } from '../../infrastructure/prisma-email-ownership-code.repository'
import { PrismaPasswordResetAccountRepository } from '../../infrastructure/prisma-password-reset-account.repository'

describe('password recovery repositories (integration)', () => {
  const codeRepository = new PrismaEmailOwnershipCodeRepository()
  const accounts = new PrismaPasswordResetAccountRepository()
  const mailbox = `ownership-${randomUUID()}@example.test`
  const validHash = hashPasswordResetCode('123456')
  const otherHash = hashPasswordResetCode('654321')
  let tenantId: string
  let otherTenantId: string
  let userId: string
  let otherUserId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Recovery fixture', slug: `recovery-${randomUUID()}` },
    })
    const otherTenant = await prisma.tenant.create({
      data: { nome: 'Other recovery fixture', slug: `recovery-other-${randomUUID()}` },
    })
    tenantId = tenant.id
    otherTenantId = otherTenant.id
    const user = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Recovery fixture',
        email: mailbox,
        senhaHash: 'original',
        papel: 'AGENT',
        ativo: false,
        emailVerificadoEm: null,
        vinculoAprovadoEm: null,
      },
    })
    const other = await prisma.usuario.create({
      data: {
        tenantId: otherTenantId,
        nome: 'Other recovery fixture',
        email: mailbox,
        senhaHash: 'other-original',
        papel: 'OWNER',
      },
    })
    userId = user.id
    otherUserId = other.id
  })
  beforeEach(async () => {
    await prisma.emailOwnershipCode.deleteMany({ where: { email: mailbox } })
    await prisma.refreshToken.deleteMany({ where: { userId: { in: [userId, otherUserId] } } })
    await prisma.usuario.update({
      where: { id: userId },
      data: { senhaHash: 'original', versaoSessao: 0 },
    })
    await prisma.usuario.update({
      where: { id: otherUserId },
      data: { senhaHash: 'other-original', versaoSessao: 0 },
    })
  })
  afterAll(async () => {
    if (!tenantId) return
    await prisma.emailOwnershipCode.deleteMany({ where: { email: mailbox } })
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantId, otherTenantId].filter(Boolean) } },
    })
    await prisma.$disconnect()
  })
  async function seedCode() {
    return prisma.emailOwnershipCode.create({
      data: { email: mailbox, codeHash: validHash, expiresAt: new Date(Date.now() + 600_000) },
    })
  }
  it('atomically enforces one code issuance and a 60-second resend interval per mailbox', async () => {
    const input = { email: mailbox, codeHash: validHash, expiresAt: new Date(Date.now() + 600_000) }
    const attempts = await Promise.all([
      codeRepository.replace(input),
      codeRepository.replace(input),
      codeRepository.replace(input),
    ])
    expect(attempts.filter(Boolean)).toHaveLength(1)
    expect(await codeRepository.replace(input)).toBe(false)
    const previous = await prisma.emailOwnershipCode.findFirstOrThrow({ where: { email: mailbox } })
    await prisma.emailOwnershipCode.update({
      where: { id: previous.id },
      data: { createdAt: new Date(Date.now() - 65_000) },
    })
    expect(await codeRepository.replace({ ...input, codeHash: otherHash })).toBe(true)
    expect(
      (await prisma.emailOwnershipCode.findUniqueOrThrow({ where: { id: previous.id } }))
        .consumedAt,
    ).not.toBeNull()
    expect(
      await codeRepository.verify({ email: mailbox, codeHash: validHash, consume: false }),
    ).toBe(false)
  })
  it('serializes failed attempts so five concurrent guesses exhaust the code', async () => {
    const code = await seedCode()
    const guesses = await Promise.all(
      Array.from({ length: 8 }, () =>
        codeRepository.verify({ email: mailbox, codeHash: otherHash, consume: false }),
      ),
    )
    expect(guesses.every((result) => result === false)).toBe(true)
    const stored = await prisma.emailOwnershipCode.findUniqueOrThrow({ where: { id: code.id } })
    expect(stored.attempts).toBe(5)
    expect(stored.consumedAt).not.toBeNull()
    expect(
      await codeRepository.verify({ email: mailbox, codeHash: validHash, consume: true }),
    ).toBe(false)
  })
  it('keeps proof active while selecting a tenant and allows exactly one concurrent consumption', async () => {
    await seedCode()
    const proof = { email: mailbox, codeHash: validHash }
    expect(await codeRepository.verify({ ...proof, consume: false })).toBe(true)
    expect(await codeRepository.verify({ ...proof, consume: false })).toBe(true)
    const claims = await Promise.all(
      Array.from({ length: 6 }, () => codeRepository.verify({ ...proof, consume: true })),
    )
    expect(claims.filter(Boolean)).toHaveLength(1)
  })
  it('rejects expired proof without consuming or issuing a new token', async () => {
    const code = await seedCode()
    await prisma.emailOwnershipCode.update({
      where: { id: code.id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    })
    expect(
      await codeRepository.verify({ email: mailbox, codeHash: validHash, consume: true }),
    ).toBe(false)
  })
  it('changes only the selected password and revokes only its refresh tokens while preserving verification and account status', async () => {
    await prisma.refreshToken.createMany({
      data: [
        {
          userId,
          tenantId,
          tokenHash: `selected-${randomUUID()}`,
          expiresAt: new Date(Date.now() + 600_000),
        },
        {
          userId: otherUserId,
          tenantId: otherTenantId,
          tokenHash: `other-${randomUUID()}`,
          expiresAt: new Date(Date.now() + 600_000),
        },
      ],
    })
    expect(
      await accounts.resetPassword({
        userId,
        tenantId,
        email: mailbox,
        sessionVersion: 0,
        passwordHash: 'new-hash',
      }),
    ).toBe(true)
    const updated = await prisma.usuario.findUniqueOrThrow({ where: { id: userId } })
    expect(updated).toMatchObject({
      senhaHash: 'new-hash',
      versaoSessao: 1,
      emailVerificadoEm: null,
      ativo: false,
      vinculoAprovadoEm: null,
    })
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: otherUserId } })).senhaHash).toBe(
      'other-original',
    )
    expect(await prisma.refreshToken.count({ where: { userId, revokedAt: null } })).toBe(0)
    expect(
      await prisma.refreshToken.count({ where: { userId: otherUserId, revokedAt: null } }),
    ).toBe(1)
  })
  it('permits only one simultaneous password reset for the same signed version', async () => {
    const input = {
      userId,
      tenantId,
      email: mailbox,
      sessionVersion: 0,
      passwordHash: 'claimed-hash',
    }
    const resets = await Promise.all([
      accounts.resetPassword(input),
      accounts.resetPassword({ ...input, passwordHash: 'second-hash' }),
    ])
    expect(resets.filter(Boolean)).toHaveLength(1)
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: userId } })).versaoSessao).toBe(1)
    expect(await accounts.resetPassword(input)).toBe(false)
    expect(
      await accounts.resetPassword({ ...input, tenantId: otherTenantId, sessionVersion: 1 }),
    ).toBe(false)
  })
  it('rolls back the password and version if refresh-token revocation fails', async () => {
    const realTransaction = prisma.$transaction.bind(prisma)
    const fail = vi.spyOn(prisma, '$transaction').mockImplementationOnce((callback) =>
      realTransaction(async (tx) => {
        return callback(
          new Proxy(tx, {
            get(target, property) {
              if (property === 'refreshToken')
                return new Proxy(target.refreshToken, {
                  get(delegate, operation) {
                    if (operation === 'updateMany')
                      return async () => {
                        throw new Error('simulated revocation failure')
                      }
                    return Reflect.get(delegate, operation)
                  },
                })
              return Reflect.get(target, property)
            },
          }),
        )
      }),
    )
    try {
      await expect(
        accounts.resetPassword({
          userId,
          tenantId,
          email: mailbox,
          sessionVersion: 0,
          passwordHash: 'must-roll-back',
        }),
      ).rejects.toThrow('simulated revocation failure')
    } finally {
      fail.mockRestore()
    }
    expect(await prisma.usuario.findUniqueOrThrow({ where: { id: userId } })).toMatchObject({
      senhaHash: 'original',
      versaoSessao: 0,
    })
  })
})
