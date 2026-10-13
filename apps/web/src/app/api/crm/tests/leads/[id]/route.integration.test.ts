import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, PATCH } from '../../../leads/[id]/route'

describe('/api/crm/leads/[id] (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let agentAToken: string
  let agentBToken: string
  let leadId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária CRM Lead Detail', slug: `crm-lead-detail-${randomUUID()}` },
    })
    tenantId = tenant.id

    async function createAgent() {
      const usuario = await prisma.usuario.create({
        data: {
          tenantId,
          nome: 'Corretor',
          email: `corretor-${randomUUID()}@ketris.dev`,
          senhaHash: 'hash-fake',
          papel: 'AGENT',
        },
      })

      const token = await tokenService.sign({
        id: usuario.id,
        tenantId: usuario.tenantId,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        ativo: usuario.ativo,
        vinculoAprovadoEm: usuario.vinculoAprovadoEm,
      })

      return { usuario, token }
    }

    const agentA = await createAgent()
    agentAToken = agentA.token

    const agentB = await createAgent()
    agentBToken = agentB.token

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        responsavelId: agentA.usuario.id,
        nome: 'Lead do Corretor A',
        telefone: '(11) 90000-0001',
        interesse: 'Apartamento 2 quartos',
        orcamento: 'Até R$ 3.000',
        origem: 'WhatsApp',
      },
    })
    leadId = lead.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildGetRequest(id: string, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/leads/${id}`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    })
  }

  function buildPatchRequest(id: string, body: unknown, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/leads/${id}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  }

  describe('GET', () => {
    it('o corretor responsável consegue ler o próprio lead', async () => {
      const response = await GET(buildGetRequest(leadId, agentAToken), {
        params: Promise.resolve({ id: leadId }),
      })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.lead.id).toBe(leadId)
    })

    it('outro corretor recebe 404 opaco para um lead que não é seu', async () => {
      const response = await GET(buildGetRequest(leadId, agentBToken), {
        params: Promise.resolve({ id: leadId }),
      })
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('LEAD_NOT_FOUND')
    })
  })

  describe('PATCH', () => {
    it('atualiza o estágio do lead', async () => {
      const response = await PATCH(
        buildPatchRequest(leadId, { stage: 'EM_CONTATO' }, agentAToken),
        {
          params: Promise.resolve({ id: leadId }),
        },
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.lead.stage).toBe('EM_CONTATO')
    })

    it('retorna 400 quando nenhum campo é informado', async () => {
      const response = await PATCH(buildPatchRequest(leadId, {}, agentAToken), {
        params: Promise.resolve({ id: leadId }),
      })

      expect(response.status).toBe(400)
    })

    it('outro corretor não consegue atualizar um lead que não é seu', async () => {
      const response = await PATCH(buildPatchRequest(leadId, { stage: 'PROPOSTA' }, agentBToken), {
        params: Promise.resolve({ id: leadId }),
      })
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('LEAD_NOT_FOUND')
    })
  })
})
