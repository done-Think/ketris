import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET } from '../../overview/route'
import { GET as getTeam } from '../../../team/route'

describe('/api/agency-dashboard/overview — corretores ativos (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let ownerToken: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Corretores Ativos', slug: `active-brokers-${randomUUID()}` },
    })
    tenantId = tenant.id
    const approvedAt = new Date('2026-10-01T12:00:00.000Z')

    async function createUser(
      name: string,
      role: 'OWNER' | 'AGENT',
      options: { active?: boolean; membershipApprovedAt?: Date | null } = {},
    ) {
      return prisma.user.create({
        data: {
          tenantId,
          name,
          email: `active-brokers-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role,
          active: options.active ?? true,
          membershipApprovedAt: options.membershipApprovedAt ?? null,
        },
      })
    }

    async function invite(userId: string, acceptedAt: Date | null) {
      await prisma.teamInvitation.create({
        data: {
          tenantId,
          userId,
          tokenHash: randomUUID(),
          expiresAt: new Date('2099-01-01T00:00:00.000Z'),
          acceptedAt,
          createdByName: 'Dona da Imobiliária',
        },
      })
    }

    const owner = await createUser('Dona da Imobiliária', 'OWNER', {
      membershipApprovedAt: approvedAt,
    })
    ownerToken = await tokenService.sign({
      id: owner.id,
      tenantId: owner.tenantId,
      name: owner.name,
      email: owner.email,
      role: owner.role,
      active: owner.active,
      membershipApprovedAt: owner.membershipApprovedAt,
    })

    await createUser('Corretor Aprovado', 'AGENT', { membershipApprovedAt: approvedAt })
    await createUser('Corretor Inativo', 'AGENT', {
      active: false,
      membershipApprovedAt: approvedAt,
    })
    await createUser('Corretor Em Análise', 'AGENT')
    const pendingInvite = await createUser('Corretor Convite Pendente', 'AGENT', {
      membershipApprovedAt: approvedAt,
    })
    await invite(pendingInvite.id, null)
    const acceptedInvite = await createUser('Corretor Convite Aceito', 'AGENT', {
      membershipApprovedAt: approvedAt,
    })
    await invite(acceptedInvite.id, approvedAt)
  })

  afterAll(async () => {
    if (tenantId) {
      await prisma.teamInvitation.deleteMany({ where: { tenantId } })
      await prisma.user.deleteMany({ where: { tenantId } })
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    await prisma.$disconnect()
  })

  function request(url: string) {
    return new NextRequest(url, { headers: { authorization: `Bearer ${ownerToken}` } })
  }

  it('conta só corretores aprovados, ativos e sem convite pendente, sem contar a dona', async () => {
    const response = await GET(request('http://localhost/api/agency-dashboard/overview'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.kpis.activeBrokersCount).toBe(2)
  })

  it('mostra o mesmo número de corretores ativos que a tela Equipe', async () => {
    const dashboard = await (
      await GET(request('http://localhost/api/agency-dashboard/overview'))
    ).json()
    const team = await (await getTeam(request('http://localhost/api/team'))).json()

    expect(dashboard.kpis.activeBrokersCount).toBe(team.summary.activeBrokers)
  })
})
