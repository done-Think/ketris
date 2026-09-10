import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { DELETE, GET, PATCH } from '../../../contacts/[id]/route'

describe('/api/crm/contacts/[id] (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária CRM Contact Detail', slug: `crm-contact-id-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { nome: 'Outra Imobiliária', slug: `crm-contact-id-other-${randomUUID()}` },
    })
    otherTenantId = other.id

    // ADMIN — o escopo por AGENT já é coberto nos testes unitários do use-case e na suíte de
    // integração de /api/crm/contacts (list).
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
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  async function createContact(tenant = tenantId) {
    return prisma.contato.create({
      data: { tenantId: tenant, nome: 'Carlos', email: `carlos-${randomUUID()}@exemplo.com` },
    })
  }

  function buildRequest(
    id: string,
    init: { method?: string; token?: string; body?: string } = {},
  ): NextRequest {
    return new NextRequest(`http://localhost/api/crm/contacts/${id}`, {
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
    it('retorna 200 para um contato do tenant do ator', async () => {
      const contact = await createContact()

      const response = await GET(
        buildRequest(contact.id, { token: actorToken }),
        context(contact.id),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.contact.id).toBe(contact.id)
    })

    it('retorna 404 (opaco) para um contato de outro tenant', async () => {
      const contact = await createContact(otherTenantId)

      const response = await GET(
        buildRequest(contact.id, { token: actorToken }),
        context(contact.id),
      )
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('CONTACT_NOT_FOUND')
    })

    it('retorna 401 sem Authorization header', async () => {
      const contact = await createContact()

      const response = await GET(buildRequest(contact.id), context(contact.id))

      expect(response.status).toBe(401)
    })
  })

  describe('PATCH', () => {
    it('atualiza campos informados', async () => {
      const contact = await createContact()

      const response = await PATCH(
        buildRequest(contact.id, {
          method: 'PATCH',
          token: actorToken,
          body: JSON.stringify({ name: 'Carlos Atualizado' }),
        }),
        context(contact.id),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.contact.name).toBe('Carlos Atualizado')
    })

    it('retorna 409 (constraint real) ao trocar para um e-mail já usado por outro contato do tenant', async () => {
      const contact = await createContact()
      const other = await createContact()

      const response = await PATCH(
        buildRequest(contact.id, {
          method: 'PATCH',
          token: actorToken,
          body: JSON.stringify({ email: other.email }),
        }),
        context(contact.id),
      )
      const json = await response.json()

      expect(response.status).toBe(409)
      expect(json.error.code).toBe('CONTACT_EMAIL_ALREADY_EXISTS')
    })

    it('retorna 400 com corpo vazio', async () => {
      const contact = await createContact()

      const response = await PATCH(
        buildRequest(contact.id, { method: 'PATCH', token: actorToken, body: JSON.stringify({}) }),
        context(contact.id),
      )

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE', () => {
    it('arquiva (soft delete) e retorna 200 com archivedAt preenchido', async () => {
      const contact = await createContact()

      const response = await DELETE(
        buildRequest(contact.id, { method: 'DELETE', token: actorToken }),
        context(contact.id),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.contact.archivedAt).not.toBeNull()

      const reloaded = await prisma.contato.findUniqueOrThrow({ where: { id: contact.id } })
      expect(reloaded.arquivadoEm).not.toBeNull()
    })
  })
})
