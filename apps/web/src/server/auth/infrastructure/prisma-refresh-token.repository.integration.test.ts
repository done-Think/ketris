import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { PrismaRefreshTokenRepository } from './prisma-refresh-token.repository'

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
        papel: 'ADMIN',
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
})
