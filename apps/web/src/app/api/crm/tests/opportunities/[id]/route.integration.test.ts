import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { DELETE, GET, PATCH, PUT } from '../../../opportunities/[id]/route'

describe('/api/crm/opportunities/[id] (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let imovelId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária CRM Opportunity Detail', slug: `crm-op-id-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { nome: 'Outra Imobiliária', slug: `crm-op-id-other-${randomUUID()}` },
    })
    otherTenantId = other.id

    // ADMIN — o escopo por AGENT (responsavelId do imóvel) já é coberto nos testes unitários de
    // cada use-case e na suíte de integração de /api/crm/opportunities (list/create).
    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Admin',
        email: `admin-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
      },
    })
    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      nome: actor.nome,
      email: actor.email,
      papel: actor.papel,
      ativo: actor.ativo,
    })

    const responsavel = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    const imovel = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: responsavel.id,
        titulo: 'Imóvel',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 2000,
        status: 'PUBLISHED',
        publicadoEm: new Date(),
      },
    })
    imovelId = imovel.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  async function createOpportunity(
    overrides: Partial<{
      status: 'RASCUNHO' | 'ENVIADA' | 'EM_NEGOCIACAO' | 'ACEITA' | 'RECUSADA'
    }> = {},
  ) {
    return prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId,
        interessadoNome: 'Maria',
        interessadoEmail: `maria-${randomUUID()}@exemplo.com`,
        valorProposto: 2500,
        status: overrides.status ?? 'ENVIADA',
      },
    })
  }

  function buildRequest(
    id: string,
    init: { method?: string; token?: string; body?: string } = {},
  ): NextRequest {
    return new NextRequest(`http://localhost/api/crm/opportunities/${id}`, {
      method: init.method,
      body: init.body,
      headers: {
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
      },
    })
  }

  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  describe('GET', () => {
    it('retorna 200 para uma oportunidade do tenant do ator', async () => {
      const opportunity = await createOpportunity()

      const response = await GET(
        buildRequest(opportunity.id, { token: actorToken }),
        context(opportunity.id),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.opportunity.id).toBe(opportunity.id)
    })

    it('retorna 404 (opaco) para uma oportunidade de outro tenant', async () => {
      const responsavel = await prisma.usuario.create({
        data: {
          tenantId: otherTenantId,
          nome: 'Corretor Outro',
          email: `corretor-outro-${randomUUID()}@ketris.dev`,
          senhaHash: 'hash-fake',
          papel: 'AGENT',
        },
      })
      const imovelOutro = await prisma.imovel.create({
        data: {
          tenantId: otherTenantId,
          responsavelId: responsavel.id,
          titulo: 'Imóvel Outro',
          finalidade: 'ALUGUEL',
          tipo: 'apartamento',
          valor: 1500,
          status: 'PUBLISHED',
          publicadoEm: new Date(),
        },
      })
      const opportunity = await prisma.oportunidade.create({
        data: {
          tenantId: otherTenantId,
          imovelId: imovelOutro.id,
          interessadoNome: 'De Outro Tenant',
          interessadoEmail: `outro-${randomUUID()}@exemplo.com`,
          valorProposto: 1500,
          status: 'ENVIADA',
        },
      })

      const response = await GET(
        buildRequest(opportunity.id, { token: actorToken }),
        context(opportunity.id),
      )
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('OPPORTUNITY_NOT_FOUND')
    })

    it('retorna 401 sem Authorization header', async () => {
      const opportunity = await createOpportunity()

      const response = await GET(buildRequest(opportunity.id), context(opportunity.id))

      expect(response.status).toBe(401)
    })
  })

  describe('PATCH', () => {
    it('atualiza campos e permite uma transição de status válida', async () => {
      const opportunity = await createOpportunity({ status: 'ENVIADA' })

      const response = await PATCH(
        buildRequest(opportunity.id, {
          method: 'PATCH',
          token: actorToken,
          body: JSON.stringify({ status: 'EM_NEGOCIACAO' }),
        }),
        context(opportunity.id),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.opportunity.status).toBe('EM_NEGOCIACAO')

      const activities = await prisma.atividadeOportunidade.findMany({
        where: { oportunidadeId: opportunity.id },
      })
      expect(activities).toHaveLength(1)
      expect(activities[0]?.tipo).toBe('MUDANCA_STATUS')
    })

    it('retorna 409 para uma transição de status inválida (ACEITA é terminal)', async () => {
      const opportunity = await createOpportunity({ status: 'ACEITA' })

      const response = await PATCH(
        buildRequest(opportunity.id, {
          method: 'PATCH',
          token: actorToken,
          body: JSON.stringify({ status: 'ENVIADA' }),
        }),
        context(opportunity.id),
      )
      const json = await response.json()

      expect(response.status).toBe(409)
      expect(json.error.code).toBe('INVALID_STATUS_TRANSITION')

      const reloaded = await prisma.oportunidade.findUniqueOrThrow({
        where: { id: opportunity.id },
      })
      expect(reloaded.status).toBe('ACEITA')
    })

    it('retorna 400 com corpo vazio', async () => {
      const opportunity = await createOpportunity()

      const response = await PATCH(
        buildRequest(opportunity.id, {
          method: 'PATCH',
          token: actorToken,
          body: JSON.stringify({}),
        }),
        context(opportunity.id),
      )

      expect(response.status).toBe(400)
    })
  })

  describe('PUT', () => {
    it('substitui a oportunidade, redefinindo campos opcionais omitidos', async () => {
      const opportunity = await createOpportunity()
      await prisma.oportunidade.update({
        where: { id: opportunity.id },
        data: { observacoes: 'Nota antiga', condicoesEspeciais: ['aceita animais'] },
      })

      const response = await PUT(
        buildRequest(opportunity.id, {
          method: 'PUT',
          token: actorToken,
          body: JSON.stringify({
            leadName: 'Maria Atualizada',
            leadEmail: opportunity.interessadoEmail,
            proposedValue: 3000,
            status: 'ENVIADA',
          }),
        }),
        context(opportunity.id),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.opportunity.leadName).toBe('Maria Atualizada')
      expect(json.opportunity.notes).toBeNull()
      expect(json.opportunity.specialConditions).toEqual([])
    })
  })

  describe('DELETE', () => {
    it('sem permanent: arquiva (soft delete) e retorna 200 com archivedAt preenchido', async () => {
      const opportunity = await createOpportunity()

      const response = await DELETE(
        buildRequest(opportunity.id, { method: 'DELETE', token: actorToken }),
        context(opportunity.id),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.opportunity.archivedAt).not.toBeNull()

      const reloaded = await prisma.oportunidade.findUniqueOrThrow({
        where: { id: opportunity.id },
      })
      expect(reloaded.arquivadaEm).not.toBeNull()
    })

    it('com permanent=true: remove o registro do banco e retorna 204', async () => {
      const opportunity = await createOpportunity()

      const response = await DELETE(
        buildRequest(`${opportunity.id}?permanent=true`, { method: 'DELETE', token: actorToken }),
        context(opportunity.id),
      )

      expect(response.status).toBe(204)

      const reloaded = await prisma.oportunidade.findUnique({ where: { id: opportunity.id } })
      expect(reloaded).toBeNull()
    })
  })
})
