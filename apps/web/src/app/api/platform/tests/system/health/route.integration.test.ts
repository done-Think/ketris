import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { GET } from '../../../system/health/route'

describe('GET /api/platform/system/health (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string

  beforeAll(async () => {
    const actor = await prisma.platformAdmin.create({
      data: {
        nome: 'Ator Saúde',
        email: `ator-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      nome: actor.nome,
      email: actor.email,
      role: 'ADMIN',
      ativo: true,
    })
  })

  afterAll(async () => {
    await prisma.platformAdmin.delete({ where: { id: actorId } })
    await prisma.$disconnect()
  })

  function buildRequest(token?: string) {
    return new NextRequest('http://localhost/api/platform/system/health', {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    })
  }

  it('retorna 401 sem token de platform admin', async () => {
    const response = await GET(buildRequest())

    expect(response.status).toBe(401)
  })

  it('mede o banco de verdade e informa o tempo no ar do servidor', async () => {
    const response = await GET(buildRequest(actorToken))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.database.status).toBe('up')
    expect(json.database.latencyMs).toEqual(expect.any(Number))
    expect(json.database.latencyMs).toBeGreaterThanOrEqual(0)
    expect(json.serverUptimeSeconds).toBeGreaterThanOrEqual(0)
    expect(new Date(json.checkedAt).getTime()).toBeGreaterThan(Date.now() - 60_000)
    expect(json.errorTracking).toHaveProperty('configured')
  })
})
