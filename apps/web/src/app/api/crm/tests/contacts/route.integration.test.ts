import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, POST } from '../../contacts/route'

describe('/api/crm/contacts (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let contactWithOpportunityId: string
  let contactWithoutOpportunityId: string
  let otherTenantContactId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária CRM Contacts', slug: `crm-contacts-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { nome: 'Outra Imobiliária', slug: `crm-contacts-other-${randomUUID()}` },
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

    const withOpportunity = await prisma.contato.create({
      data: { tenantId, nome: 'Carlos', email: `carlos-${randomUUID()}@exemplo.com` },
    })
    contactWithOpportunityId = withOpportunity.id

    await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId: imovel.id,
        contatoId: contactWithOpportunityId,
        interessadoNome: 'Carlos',
        interessadoEmail: withOpportunity.email,
        valorProposto: 2500,
        status: 'ENVIADA',
      },
    })

    const withoutOpportunity = await prisma.contato.create({
      data: { tenantId, nome: 'Beatriz', email: `beatriz-${randomUUID()}@exemplo.com` },
    })
    contactWithoutOpportunityId = withoutOpportunity.id

    const outro = await prisma.contato.create({
      data: {
        tenantId: otherTenantId,
        nome: 'De Outro Tenant',
        email: `outro-${randomUUID()}@exemplo.com`,
      },
    })
    otherTenantContactId = outro.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  function buildGetRequest(query = '', token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/contacts${query}`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    })
  }

  function buildPostRequest(body: unknown, token?: string): NextRequest {
    return new NextRequest('http://localhost/api/crm/contacts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  }

  describe('GET', () => {
    it('retorna os contatos do tenant do ator com propertyCount agregado corretamente', async () => {
      const response = await GET(buildGetRequest('', actorToken))
      const json = await response.json()

      expect(response.status).toBe(200)
      const byId = Object.fromEntries(json.contacts.map((c: { id: string }) => [c.id, c]))
      expect(byId[contactWithOpportunityId].propertyCount).toBe(1)
      expect(byId[contactWithoutOpportunityId].propertyCount).toBe(0)
      expect(byId[otherTenantContactId]).toBeUndefined()
    })

    it('filtra por busca textual no nome', async () => {
      const response = await GET(buildGetRequest('?q=Carlos', actorToken))
      const json = await response.json()

      const names = json.contacts.map((c: { name: string }) => c.name)
      expect(names).toContain('Carlos')
      expect(names).not.toContain('Beatriz')
    })

    it('retorna 401 sem Authorization header', async () => {
      const response = await GET(buildGetRequest())

      expect(response.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('cria o contato com e-mail normalizado para minúsculas', async () => {
      const email = `Novo.Contato.${randomUUID()}@Exemplo.com`

      const response = await POST(buildPostRequest({ name: 'Novo Contato', email }, actorToken))
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.contact.email).toBe(email.toLowerCase())

      await prisma.contato.delete({ where: { id: json.contact.id } })
    })

    it('retorna 409 (constraint real do banco) para e-mail duplicado no mesmo tenant', async () => {
      const email = `duplicado-${randomUUID()}@exemplo.com`
      const first = await POST(buildPostRequest({ name: 'Primeiro', email }, actorToken))
      expect(first.status).toBe(201)

      const second = await POST(buildPostRequest({ name: 'Segundo', email }, actorToken))
      const json = await second.json()

      expect(second.status).toBe(409)
      expect(json.error.code).toBe('CONTACT_EMAIL_ALREADY_EXISTS')

      const firstJson = await first.json()
      await prisma.contato.delete({ where: { id: firstJson.contact.id } })
    })

    it('permite o mesmo e-mail em tenants diferentes (unique é composto com tenantId)', async () => {
      const email = `mesmo-email-${randomUUID()}@exemplo.com`
      await prisma.contato.create({ data: { tenantId: otherTenantId, nome: 'Já existe', email } })

      const response = await POST(buildPostRequest({ name: 'Novo', email }, actorToken))
      const json = await response.json()

      expect(response.status).toBe(201)

      await prisma.contato.delete({ where: { id: json.contact.id } })
    })

    it('retorna 400 quando falta um campo obrigatório', async () => {
      const response = await POST(buildPostRequest({ name: 'Sem E-mail' }, actorToken))

      expect(response.status).toBe(400)
    })
  })
})
