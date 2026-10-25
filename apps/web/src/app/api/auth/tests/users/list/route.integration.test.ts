import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { authContainer } from '@server/auth/container'
import { toAuthenticatedUser } from '@server/auth/domain/user.entity'
import { prisma } from '@server/db/prisma'
import { GET } from '../../../users/route'

let tenantId: string
let foreignId: string
let token: string
function request(query: string) {
  return new NextRequest(`http://localhost/api/auth/users?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

describe('paginação dos usuários autenticados', () => {
  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Paginação Auth', slug: `list-${randomUUID()}` },
    })
    tenantId = tenant.id
    const other = await prisma.tenant.create({
      data: { nome: 'Outro tenant', slug: `foreign-${randomUUID()}` },
    })
    foreignId = other.id
    const owner = await authContainer.userRepository.create({
      tenantId,
      nome: 'Gestão',
      email: `${randomUUID()}@example.test`,
      senhaHash: 'hash-fake',
      papel: 'OWNER',
      emailVerifiedAt: new Date(),
    })
    token = await authContainer.tokenService.sign(toAuthenticatedUser(owner))
    await prisma.usuario.createMany({
      data: [
        ...Array.from({ length: 3 }, () => ({
          tenantId,
          nome: 'Pendente',
          email: `${randomUUID()}@example.test`,
          senhaHash: 'hash-fake',
          papel: 'AGENT' as const,
          vinculoAprovadoEm: null,
        })),
        {
          tenantId: foreignId,
          nome: 'Fora do tenant',
          email: `${randomUUID()}@example.test`,
          senhaHash: 'hash-fake',
          papel: 'AGENT',
          vinculoAprovadoEm: null,
        },
      ],
    })
  })
  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantId, foreignId].filter(Boolean) } } })
  })

  it('filtra pendentes antes de paginar e contar sem expor usuários de outro tenant', async () => {
    const first = await GET(request('page=1&pageSize=2&pendingApproval=true'))
    expect(first.status).toBe(200)
    const body = await first.json()
    expect(body.total).toBe(3)
    expect(body.users).toHaveLength(2)
    expect(body.page).toBe(1)
    expect(
      body.users.every(
        (user: { tenantId: string; pendingApproval: boolean }) =>
          user.tenantId === tenantId && user.pendingApproval,
      ),
    ).toBe(true)
    const next = await GET(request('page=2&pageSize=2&pendingApproval=true'))
    const page = await next.json()
    expect(page.total).toBe(3)
    expect(page.users).toHaveLength(1)
    expect(
      new Set([...body.users, ...page.users].map((user: { id: string }) => user.id)).size,
    ).toBe(3)
  })
  it.each(['page=0', 'page=1.5', 'pageSize=101', 'pendingApproval=unknown', 'tenantId=foreign'])(
    'rejeita query inválida %s',
    async (query) => {
      expect((await GET(request(query))).status).toBe(400)
    },
  )
})
