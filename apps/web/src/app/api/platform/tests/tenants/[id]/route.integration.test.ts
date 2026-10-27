import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { GET } from '../../../tenants/[id]/route'

describe('GET /api/platform/tenants/[id] (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let adminId: string
  let token: string
  let tenantId: string
  const slug = `detalhe-${randomUUID()}`

  beforeAll(async () => {
    const admin = await prisma.platformAdmin.create({
      data: {
        nome: 'Leitor',
        email: `leitor-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    adminId = admin.id
    token = await tokenService.sign({
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      role: 'AGENT',
      ativo: true,
    })
    tenantId = (
      await prisma.tenant.create({
        data: { nome: 'Tenant Detalhe', slug, accountType: 'AGENCY', status: 'ACTIVE' },
      })
    ).id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.platformAdmin.delete({ where: { id: adminId } })
    await prisma.$disconnect()
  })

  function get(id: string, auth = true) {
    return GET(
      new NextRequest(`http://localhost/api/platform/tenants/${id}`, {
        headers: auth ? { authorization: `Bearer ${token}` } : {},
      }),
      { params: Promise.resolve({ id }) },
    )
  }

  it('devolve um tenant com a mensalidade para qualquer platform admin', async () => {
    const response = await get(tenantId)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.tenant).toMatchObject({ id: tenantId, slug, accountType: 'AGENCY' })
    expect(json.tenant).toHaveProperty('monthlyCharge')
  })

  it('responde 404 para tenant inexistente e 401 sem token', async () => {
    expect((await get('inexistente')).status).toBe(404)
    expect((await get(tenantId, false)).status).toBe(401)
  })
})
