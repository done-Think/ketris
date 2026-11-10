import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { PrismaTeamMembershipRequestRepository } from '../../infrastructure/prisma-team-membership-request.repository'

const requests = new PrismaTeamMembershipRequestRepository()

describe('PrismaTeamMembershipRequestRepository (integração)', () => {
  let tenantId: string
  let otherTenantId: string

  async function tenant(name: string) {
    return (await prisma.tenant.create({ data: { name, slug: `vinculo-${randomUUID()}` } })).id
  }

  async function agent(inTenant: string, approved: boolean) {
    const user = await prisma.user.create({
      data: {
        tenantId: inTenant,
        name: 'Marcos',
        email: `marcos-${randomUUID()}@vinculo.example.test`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
        membershipApprovedAt: approved ? new Date() : null,
      },
    })
    await prisma.brokerPublicProfile.create({
      data: { userId: user.id, displayName: 'Marcos', status: 'DRAFT' },
    })
    await prisma.userAuditEvent.create({
      data: {
        userId: user.id,
        tenantId: inTenant,
        action: 'CREATED',
        actorType: 'SELF_REGISTRATION',
        actorUserId: user.id,
        changedFields: [],
      },
    })
    return user.id
  }

  beforeAll(async () => {
    tenantId = await tenant('Imobiliária Vínculo')
    otherTenantId = await tenant('Outra Imobiliária')
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { tenantId: { in: [tenantId, otherTenantId] } } })
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantId, otherTenantId] } } })
  })

  it('apaga o pedido pendente com o rascunho de perfil e libera o e-mail', async () => {
    const pendingId = await agent(tenantId, false)

    expect(await requests.isPending(tenantId, pendingId)).toBe(true)
    expect(await requests.hasPortfolio(tenantId, pendingId)).toBe(false)
    expect(await requests.deletePending(tenantId, pendingId)).toBe(true)

    expect(await prisma.user.findUnique({ where: { id: pendingId } })).toBeNull()
    expect(await prisma.brokerPublicProfile.count({ where: { userId: pendingId } })).toBe(0)
    expect(await requests.isPending(tenantId, pendingId)).toBe(false)
  })

  it('não apaga corretor já aprovado nem pedido de outra imobiliária', async () => {
    const approvedId = await agent(tenantId, true)
    const elsewhereId = await agent(otherTenantId, false)

    expect(await requests.isPending(tenantId, approvedId)).toBe(false)
    expect(await requests.deletePending(tenantId, approvedId)).toBe(false)
    expect(await requests.isPending(tenantId, elsewhereId)).toBe(false)
    expect(await requests.deletePending(tenantId, elsewhereId)).toBe(false)

    expect(await prisma.user.count({ where: { id: { in: [approvedId, elsewhereId] } } })).toBe(2)
  })
})
