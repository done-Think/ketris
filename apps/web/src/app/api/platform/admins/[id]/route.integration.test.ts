import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { DELETE, GET, PATCH } from './route'

describe('/api/platform/admins/[id] (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string
  let targetId: string

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

    const target = await prisma.platformAdmin.create({
      data: {
        nome: 'Alvo Teste',
        email: `alvo-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
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
      params: { id: targetId },
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admin.id).toBe(targetId)
  })

  it('GET retorna 404 para um id inexistente', async () => {
    const response = await GET(buildRequest('GET', undefined, actorToken), {
      params: { id: 'inexistente' },
    })

    expect(response.status).toBe(404)
  })

  it('PATCH atualiza o nome quando autenticado', async () => {
    const response = await PATCH(buildRequest('PATCH', { nome: 'Nome Atualizado' }, actorToken), {
      params: { id: targetId },
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admin.nome).toBe('Nome Atualizado')
  })

  it('DELETE desativa o alvo quando autenticado e o ator não é o próprio alvo', async () => {
    const response = await DELETE(buildRequest('DELETE', undefined, actorToken), {
      params: { id: targetId },
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admin.ativo).toBe(false)
  })

  it('DELETE retorna 400 quando o ator tenta se autodesativar', async () => {
    const response = await DELETE(buildRequest('DELETE', undefined, actorToken), {
      params: { id: actorId },
    })
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('CANNOT_DEACTIVATE_SELF')
  })
})
