import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { DELETE, GET, PATCH } from '../../../admins/[id]/route'

describe('/api/platform/admins/[id] (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string
  let targetId: string

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

    const target = await prisma.platformAdmin.create({
      data: {
        name: 'Alvo Teste',
        email: `alvo-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
      },
    })
    targetId = target.id
  })

  afterAll(async () => {
    await prisma.platformAdminRefreshToken.deleteMany({
      where: { platformAdminId: { in: [actorId, targetId] } },
    })
    await prisma.platformAdmin.deleteMany({ where: { id: { in: [actorId, targetId] } } })
    await prisma.$disconnect()
  })

  function buildRequest(method: string, body?: unknown, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/platform/admins/${targetId}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('GET retorna 200 e o platform admin quando autenticado', async () => {
    const response = await GET(buildRequest('GET', undefined, actorToken), {
      params: Promise.resolve({ id: targetId }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admin.id).toBe(targetId)
  })

  it('GET retorna 404 para um id inexistente', async () => {
    const response = await GET(buildRequest('GET', undefined, actorToken), {
      params: Promise.resolve({ id: 'inexistente' }),
    })

    expect(response.status).toBe(404)
  })

  it('PATCH atualiza o nome quando autenticado', async () => {
    const response = await PATCH(buildRequest('PATCH', { name: 'Nome Atualizado' }, actorToken), {
      params: Promise.resolve({ id: targetId }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admin.name).toBe('Nome Atualizado')
  })

  it('DELETE desativa o alvo quando autenticado e o ator não é o próprio alvo', async () => {
    const response = await DELETE(buildRequest('DELETE', undefined, actorToken), {
      params: Promise.resolve({ id: targetId }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admin.active).toBe(false)
  })

  it('PATCH reativa o alvo quando autenticado', async () => {
    const response = await PATCH(buildRequest('PATCH', { active: true }, actorToken), {
      params: Promise.resolve({ id: targetId }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admin.active).toBe(true)
  })

  it('PATCH não permite desativar o alvo', async () => {
    const response = await PATCH(buildRequest('PATCH', { active: false }, actorToken), {
      params: Promise.resolve({ id: targetId }),
    })

    expect(response.status).toBe(400)
  })

  it('DELETE retorna 400 quando o ator tenta se autodesativar', async () => {
    const response = await DELETE(buildRequest('DELETE', undefined, actorToken), {
      params: Promise.resolve({ id: actorId }),
    })
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('CANNOT_DEACTIVATE_SELF')
  })
})
