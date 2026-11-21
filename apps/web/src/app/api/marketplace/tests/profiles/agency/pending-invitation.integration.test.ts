import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET as getAgencyPublic } from '../../../agencies/[id]/route'
import { PUT } from '../../../profiles/agency/route'

describe('/api/marketplace/profiles/agency — convites pendentes (integração)', () => {
  const tokenService = new JoseTokenService()
  const approvedAt = new Date('2026-01-01T12:00:00.000Z')
  let tenantId: string
  let ownerToken: string
  const ids: Record<'member' | 'invitedAccepted' | 'pending' | 'deactivated', string> = {
    member: '',
    invitedAccepted: '',
    pending: '',
    deactivated: '',
  }

  async function createAgent(name: string, extra: { active?: boolean } = {}) {
    const user = await prisma.user.create({
      data: {
        tenantId,
        name,
        email: `${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
        membershipApprovedAt: approvedAt,
        ...extra,
      },
    })
    return user.id
  }

  async function invite(userId: string, acceptedAt: Date | null) {
    await prisma.teamInvitation.create({
      data: {
        tenantId,
        userId,
        tokenHash: randomUUID(),
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
        acceptedAt,
        createdByName: 'Dona',
      },
    })
  }

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária Convites', slug: `convites-${randomUUID()}` },
    })
    tenantId = tenant.id

    const owner = await prisma.user.create({
      data: {
        tenantId,
        name: 'Dona da Imobiliária',
        email: `${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'OWNER',
        membershipApprovedAt: approvedAt,
      },
    })
    ownerToken = await tokenService.sign({
      id: owner.id,
      tenantId,
      name: owner.name,
      email: owner.email,
      role: owner.role,
      active: owner.active,
      membershipApprovedAt: owner.membershipApprovedAt,
    })

    ids.member = await createAgent('Corretora da Casa')
    ids.invitedAccepted = await createAgent('Corretor que Aceitou')
    await invite(ids.invitedAccepted, approvedAt)
    ids.pending = await createAgent('Corretora com Convite Pendente')
    await invite(ids.pending, null)
    ids.deactivated = await createAgent('Corretor Desativado', { active: false })
  })

  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('não salva na equipe em destaque quem ainda não aceitou o convite', async () => {
    const response = await PUT(
      new NextRequest('http://localhost/api/marketplace/profiles/agency', {
        method: 'PUT',
        headers: { authorization: `Bearer ${ownerToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Imobiliária Convites',
          coverage: [],
          segments: [],
          team: [
            { userId: ids.member, order: 1 },
            { userId: ids.pending, order: 2 },
            { userId: ids.invitedAccepted, order: 3 },
            { userId: ids.deactivated, order: 4 },
          ],
        }),
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.profile.team.map((member: { userId: string }) => member.userId)).toEqual([
      ids.member,
      ids.invitedAccepted,
    ])
  })

  it('não conta nem mostra no perfil público quem ainda não aceitou o convite', async () => {
    const profile = await prisma.agencyPublicProfile.update({
      where: { tenantId },
      data: { status: 'PUBLISHED', publishedAt: approvedAt },
    })
    await prisma.agencyProfileHighlight.create({
      data: { profileId: profile.id, userId: ids.pending, position: 9 },
    })

    const response = await getAgencyPublic(
      new NextRequest(`http://localhost/api/marketplace/agencies/${tenantId}`),
      { params: Promise.resolve({ id: tenantId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.agency.stats.brokersCount).toBe(3)
    expect(json.agency.team.map((member: { userId: string }) => member.userId)).toEqual([
      ids.member,
      ids.invitedAccepted,
    ])
  })
})
