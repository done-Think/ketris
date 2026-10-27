import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import {
  generateTeamInvitationToken,
  hashTeamInvitationToken,
} from '@server/team/domain/team-invitation-token'

import { GET as getTeam } from '../route'
import { PUT as setGoal } from '../members/[id]/goal/route'
import { POST as deactivate } from '../members/[id]/deactivate/route'
import { GET as previewInvitation, POST as acceptInvitation } from '../invitations/accept/route'

describe('/api/team (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let ownerToken: string
  let agentToken: string
  let agentId: string
  let otherAgentId: string

  async function seedUser(name: string, papel: 'OWNER' | 'AGENT') {
    const user = await prisma.usuario.create({
      data: {
        tenantId,
        nome: name,
        email: `${name.toLowerCase()}-${randomUUID()}@team.example.test`,
        senhaHash: 'hash-fake',
        papel,
      },
    })
    const token = await tokenService.sign({
      id: user.id,
      tenantId: user.tenantId,
      nome: user.nome,
      email: user.email,
      papel: user.papel,
      ativo: user.ativo,
      vinculoAprovadoEm: user.vinculoAprovadoEm,
    })
    return { user, token }
  }

  function request(url: string, method = 'GET', token?: string, body?: unknown) {
    return new NextRequest(`http://localhost/api${url}`, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  const params = (id: string) => ({ params: Promise.resolve({ id }) })

  beforeAll(async () => {
    tenantId = (
      await prisma.tenant.create({
        data: { nome: 'Equipe Rotas', slug: `team-routes-${randomUUID()}` },
      })
    ).id
    ownerToken = (await seedUser('Dona', 'OWNER')).token
    const agent = await seedUser('Marina', 'AGENT')
    agentToken = agent.token
    agentId = agent.user.id
    otherAgentId = (await seedUser('Thiago', 'AGENT')).user.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('mostra a equipe só para o OWNER', async () => {
    const response = await getTeam(request('/team', 'GET', ownerToken))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.members.map((member: { name: string }) => member.name)).toEqual([
      'Marina',
      'Thiago',
    ])
    expect(json.summary).toMatchObject({
      activeBrokers: 2,
      monthlySales: 0,
      averageGoalProgress: null,
    })
    expect((await getTeam(request('/team', 'GET', agentToken))).status).toBe(403)
    expect((await getTeam(request('/team'))).status).toBe(401)
  })

  it('grava a meta com o autor e valida o corpo', async () => {
    const response = await setGoal(
      request(`/team/members/${agentId}/goal`, 'PUT', ownerToken, { monthlySales: 6 }),
      params(agentId),
    )

    expect(response.status).toBe(200)
    expect((await response.json()).goal).toMatchObject({ monthlySales: 6, setByName: 'Dona' })
    expect(
      (
        await setGoal(
          request(`/team/members/${agentId}/goal`, 'PUT', ownerToken, { monthlySales: 0 }),
          params(agentId),
        )
      ).status,
    ).toBe(400)
  })

  it('exige destino para desativar', async () => {
    expect(
      (
        await deactivate(
          request(`/team/members/${agentId}/deactivate`, 'POST', ownerToken, {}),
          params(agentId),
        )
      ).status,
    ).toBe(400)
    const response = await deactivate(
      request(`/team/members/${agentId}/deactivate`, 'POST', ownerToken, {
        destinationId: otherAgentId,
      }),
      params(agentId),
    )
    expect(response.status).toBe(200)
    expect((await response.json()).transferred).toEqual({
      properties: 0,
      leads: 0,
      futureEvents: 0,
    })
  })

  it('aceita o convite pelo link público uma única vez', async () => {
    const token = generateTeamInvitationToken()
    const invited = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Bruna',
        email: `bruna-${randomUUID()}@team.example.test`,
        senhaHash: 'hash-inutil',
        papel: 'AGENT',
        emailVerificadoEm: null,
      },
    })
    await prisma.conviteEquipe.create({
      data: {
        tenantId,
        usuarioId: invited.id,
        tokenHash: hashTeamInvitationToken(token),
        expiraEm: new Date(Date.now() + 3600_000),
        criadoPorNome: 'Dona',
      },
    })

    const preview = await previewInvitation(
      request(`/team/invitations/accept?token=${encodeURIComponent(token)}`),
    )
    expect((await preview.json()).invitation).toMatchObject({
      name: 'Bruna',
      agencyName: 'Equipe Rotas',
      status: 'VALID',
    })
    const accept = () =>
      acceptInvitation(
        request('/team/invitations/accept', 'POST', undefined, {
          token,
          password: 'senha-forte-123',
        }),
      )
    expect((await accept()).status).toBe(200)
    expect((await accept()).status).toBe(409)
    expect(
      (await prisma.usuario.findUniqueOrThrow({ where: { id: invited.id } })).emailVerificadoEm,
    ).not.toBeNull()
    expect(
      (await previewInvitation(request('/team/invitations/accept?token=desconhecido-123456789')))
        .status,
    ).toBe(404)
  })
})
