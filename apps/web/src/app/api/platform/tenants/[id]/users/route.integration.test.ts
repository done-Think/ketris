import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { GET } from './route'

describe('GET /api/platform/tenants/[id]/users (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string
  let tenantId: string

  beforeAll(async () => {
    const actor = await prisma.platformAdmin.create({
      data: {
        nome: 'Ator Teste',
        email: `ator-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      nome: actor.nome,
      email: actor.email,
      ativo: true,
    })

    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant com Usuários', slug: `tenant-users-${randomUUID()}` },
    })
    tenantId = tenant.id

    await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Admin do Tenant',
        email: `admin-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
      },
    })
    await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Agente do Tenant',
        email: `agente-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.platformAdminRefreshToken.deleteMany({ where: { platformAdminId: actorId } })
    await prisma.platformAdmin.delete({ where: { id: actorId } })
    await prisma.$disconnect()
  })

  function buildRequest(url: string, token?: string): NextRequest {
    return new NextRequest(url, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    })
  }

  it('retorna 200 e todos os usuários do tenant, incluindo a conta ADMIN', async () => {
    const response = await GET(
      buildRequest(`http://localhost/api/platform/tenants/${tenantId}/users`, actorToken),
      { params: { id: tenantId } },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.users).toHaveLength(2)
    expect(json.users.some((user: { papel: string }) => user.papel === 'ADMIN')).toBe(true)
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(
      buildRequest(`http://localhost/api/platform/tenants/${tenantId}/users`),
      { params: { id: tenantId } },
    )

    expect(response.status).toBe(401)
  })

  it('retorna 404 para um tenant inexistente', async () => {
    const response = await GET(
      buildRequest('http://localhost/api/platform/tenants/inexistente/users', actorToken),
      { params: { id: 'inexistente' } },
    )

    expect(response.status).toBe(404)
  })
})
