import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { POST as createAdmin } from '../admins/route'
import { DELETE as deactivateAdmin, PATCH as updateAdmin } from '../admins/[id]/route'
import { POST as createTenantAdmin } from '../tenants/[id]/admins/route'

describe('ações restritas ao papel ADMIN da plataforma (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  const tokens: Record<'ADMIN_AGENT' | 'AGENT', string> = { ADMIN_AGENT: '', AGENT: '' }
  const adminIds: string[] = []
  let targetId: string
  let tenantId: string

  beforeAll(async () => {
    for (const role of ['ADMIN_AGENT', 'AGENT'] as const) {
      const admin = await prisma.platformAdmin.create({
        data: {
          name: `Papel ${role}`,
          email: `${role.toLowerCase()}-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role,
        },
      })
      adminIds.push(admin.id)
      tokens[role] = await tokenService.sign({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role,
        active: true,
      })
    }
    const target = await prisma.platformAdmin.create({
      data: { name: 'Alvo', email: `alvo-${randomUUID()}@ketris.dev`, passwordHash: 'hash-fake' },
    })
    targetId = target.id
    adminIds.push(target.id)
    tenantId = (
      await prisma.tenant.create({ data: { name: 'Tenant Papel', slug: `papel-${randomUUID()}` } })
    ).id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.platformAdmin.deleteMany({ where: { id: { in: adminIds } } })
    await prisma.$disconnect()
  })

  function request(url: string, method: string, token: string, body?: unknown) {
    return new NextRequest(`http://localhost/api/platform${url}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
    })
  }

  for (const role of ['ADMIN_AGENT', 'AGENT'] as const)
    it(`${role} recebe 403 ao gerenciar admins e ao criar o admin de um tenant`, async () => {
      const token = tokens[role]
      const email = `bloqueado-${randomUUID()}@ketris.dev`
      const params = { params: Promise.resolve({ id: targetId }) }

      const responses = [
        await createAdmin(
          request('/admins', 'POST', token, {
            name: 'Bloqueado',
            email,
            password: 'senha-longa-123',
            role: 'ADMIN',
          }),
        ),
        await updateAdmin(
          request(`/admins/${targetId}`, 'PATCH', token, { role: 'AGENT' }),
          params,
        ),
        await deactivateAdmin(request(`/admins/${targetId}`, 'DELETE', token), params),
        await createTenantAdmin(
          request(`/tenants/${tenantId}/admins`, 'POST', token, {
            name: 'Dono',
            email,
            password: 'senha-longa-123',
          }),
          { params: Promise.resolve({ id: tenantId }) },
        ),
      ]

      expect(responses.map((response) => response.status)).toEqual([403, 403, 403, 403])
      expect(await prisma.platformAdmin.count({ where: { email } })).toBe(0)
      expect(await prisma.user.count({ where: { email } })).toBe(0)
      expect(await prisma.platformAdmin.findUnique({ where: { id: targetId } })).toMatchObject({
        role: 'ADMIN',
        active: true,
      })
    })
})
