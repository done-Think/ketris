import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { GET } from '../../../../tenants/[id]/users/route'

describe('GET /api/platform/tenants/[id]/users (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string
  let tenantId: string

  beforeAll(async () => {
    const actor = await prisma.platformAdmin.create({
      data: {
        name: 'Ator Teste',
        email: `ator-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      name: actor.name,
      email: actor.email,
      role: 'ADMIN',
      active: true,
    })

    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant com Usuários', slug: `tenant-users-${randomUUID()}` },
    })
    tenantId = tenant.id

    await prisma.user.create({
      data: {
        tenantId,
        name: 'Admin do Tenant',
        email: `admin-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'OWNER',
      },
    })
    await prisma.user.create({
      data: {
        tenantId,
        name: 'Agente do Tenant',
        email: `agente-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
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
      { params: Promise.resolve({ id: tenantId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.users).toHaveLength(2)
    expect(json.users.some((user: { role: string }) => user.role === 'OWNER')).toBe(true)
    expect(json).toMatchObject({ totalCount: 2, page: 1, pageSize: 20 })
  })

  it('pagina os usuários pela ordem de criação', async () => {
    const pages = await Promise.all(
      [1, 2].map(async (page) =>
        (
          await GET(
            buildRequest(
              `http://localhost/api/platform/tenants/${tenantId}/users?page=${page}&pageSize=1`,
              actorToken,
            ),
            { params: Promise.resolve({ id: tenantId }) },
          )
        ).json(),
      ),
    )

    expect(pages.map((page) => page.users.length)).toEqual([1, 1])
    expect(pages[0].users[0].id).not.toBe(pages[1].users[0].id)
    expect(pages[1]).toMatchObject({ totalCount: 2, page: 2, pageSize: 1 })
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(
      buildRequest(`http://localhost/api/platform/tenants/${tenantId}/users`),
      { params: Promise.resolve({ id: tenantId }) },
    )

    expect(response.status).toBe(401)
  })

  it('retorna 404 para um tenant inexistente', async () => {
    const response = await GET(
      buildRequest('http://localhost/api/platform/tenants/inexistente/users', actorToken),
      { params: Promise.resolve({ id: 'inexistente' }) },
    )

    expect(response.status).toBe(404)
  })
})
