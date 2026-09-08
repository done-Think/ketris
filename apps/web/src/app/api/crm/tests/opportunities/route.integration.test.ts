import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, POST } from '../../opportunities/route'

describe('/api/crm/opportunities (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let imovelId: string
  let otherTenantImovelId: string
  let contatoId: string
  let otherTenantContatoId: string
  let activeId: string
  let archivedId: string
  let otherTenantOpportunityId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária CRM Opportunities', slug: `crm-op-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { nome: 'Outra Imobiliária', slug: `crm-op-other-${randomUUID()}` },
    })
    otherTenantId = other.id

    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Agente',
        email: `agente-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
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

    const contato = await prisma.contato.create({
      data: { tenantId, nome: 'Carlos', email: `carlos-${randomUUID()}@exemplo.com` },
    })
    contatoId = contato.id

    const active = await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId,
        interessadoNome: 'Ativo',
        interessadoEmail: `ativo-${randomUUID()}@exemplo.com`,
        valorProposto: 2000,
        status: 'ENVIADA',
      },
    })
    activeId = active.id

    const archived = await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId,
        interessadoNome: 'Arquivado',
        interessadoEmail: `arquivado-${randomUUID()}@exemplo.com`,
        valorProposto: 2000,
        status: 'ENVIADA',
        arquivadaEm: new Date(),
      },
    })
    archivedId = archived.id

    const outroResponsavel = await prisma.usuario.create({
      data: {
        tenantId: otherTenantId,
        nome: 'Corretor Outro',
        email: `corretor-outro-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    const outroImovel = await prisma.imovel.create({
      data: {
        tenantId: otherTenantId,
        responsavelId: outroResponsavel.id,
        titulo: 'Imóvel de Outro Tenant',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 1500,
        status: 'PUBLISHED',
        publicadoEm: new Date(),
      },
    })
    otherTenantImovelId = outroImovel.id

    const outroContato = await prisma.contato.create({
      data: { tenantId: otherTenantId, nome: 'Outro', email: `outro-${randomUUID()}@exemplo.com` },
    })
    otherTenantContatoId = outroContato.id

    const outraOportunidade = await prisma.oportunidade.create({
      data: {
        tenantId: otherTenantId,
        imovelId: otherTenantImovelId,
        interessadoNome: 'De Outro Tenant',
        interessadoEmail: `outro-op-${randomUUID()}@exemplo.com`,
        valorProposto: 1500,
        status: 'ENVIADA',
      },
    })
    otherTenantOpportunityId = outraOportunidade.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  function buildGetRequest(query = '', token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/opportunities${query}`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    })
  }

  function buildPostRequest(body: unknown, token?: string): NextRequest {
    return new NextRequest('http://localhost/api/crm/opportunities', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  }

  describe('GET', () => {
    it('retorna 200 e apenas as oportunidades ativas do tenant do ator', async () => {
      const response = await GET(buildGetRequest('', actorToken))
      const json = await response.json()

      expect(response.status).toBe(200)
      const ids = json.opportunities.map((o: { id: string }) => o.id)
      expect(ids).toContain(activeId)
      expect(ids).not.toContain(archivedId)
      expect(ids).not.toContain(otherTenantOpportunityId)
    })

    it('inclui as arquivadas quando includeArchived=true', async () => {
      const response = await GET(buildGetRequest('?includeArchived=true', actorToken))
      const json = await response.json()

      const ids = json.opportunities.map((o: { id: string }) => o.id)
      expect(ids).toContain(archivedId)
    })

    it('retorna 401 sem Authorization header', async () => {
      const response = await GET(buildGetRequest())

      expect(response.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('cria a oportunidade em RASCUNHO por padrão, vinculada ao imóvel do tenant do ator', async () => {
      const response = await POST(
        buildPostRequest(
          {
            propertyId: imovelId,
            leadName: 'Novo Lead',
            leadEmail: `lead-${randomUUID()}@exemplo.com`,
            proposedValue: 3000,
          },
          actorToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.opportunity.status).toBe('RASCUNHO')
      expect(json.opportunity.propertyId).toBe(imovelId)
      expect(json.opportunity.tenantId).toBe(tenantId)

      await prisma.oportunidade.delete({ where: { id: json.opportunity.id } })
    })

    it('aceita contactId do próprio tenant e vincula a oportunidade a ele', async () => {
      const response = await POST(
        buildPostRequest(
          {
            propertyId: imovelId,
            contactId: contatoId,
            leadName: 'Lead Vinculado',
            leadEmail: `lead-vinc-${randomUUID()}@exemplo.com`,
            proposedValue: 3000,
          },
          actorToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.opportunity.contactId).toBe(contatoId)

      await prisma.oportunidade.delete({ where: { id: json.opportunity.id } })
    })

    it('retorna 404 quando o propertyId pertence a outro tenant (isolamento multi-tenant)', async () => {
      const response = await POST(
        buildPostRequest(
          {
            propertyId: otherTenantImovelId,
            leadName: 'Tentativa Cross-Tenant',
            leadEmail: `cross-${randomUUID()}@exemplo.com`,
            proposedValue: 3000,
          },
          actorToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('OPPORTUNITY_PROPERTY_NOT_FOUND')
    })

    it('retorna 404 quando o contactId pertence a outro tenant (isolamento multi-tenant)', async () => {
      const response = await POST(
        buildPostRequest(
          {
            propertyId: imovelId,
            contactId: otherTenantContatoId,
            leadName: 'Tentativa Cross-Tenant',
            leadEmail: `cross-contato-${randomUUID()}@exemplo.com`,
            proposedValue: 3000,
          },
          actorToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('CONTACT_NOT_FOUND')
    })

    it('retorna 400 quando falta um campo obrigatório', async () => {
      const response = await POST(buildPostRequest({ propertyId: imovelId }, actorToken))

      expect(response.status).toBe(400)
    })

    it('retorna 401 sem Authorization header', async () => {
      const response = await POST(
        buildPostRequest({
          propertyId: imovelId,
          leadName: 'Sem Auth',
          leadEmail: 'x@exemplo.com',
          proposedValue: 1000,
        }),
      )

      expect(response.status).toBe(401)
    })
  })
})
