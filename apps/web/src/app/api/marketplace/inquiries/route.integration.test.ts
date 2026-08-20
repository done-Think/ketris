import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET } from './route'

describe('GET /api/marketplace/inquiries (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let activeId: string
  let archivedId: string
  let otherTenantInquiryId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária Inquiries List', slug: `mkt-inq-list-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { nome: 'Outra Imobiliária', slug: `mkt-inq-other-${randomUUID()}` },
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

    const active = await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId: imovel.id,
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
        imovelId: imovel.id,
        interessadoNome: 'Arquivado',
        interessadoEmail: `arquivado-${randomUUID()}@exemplo.com`,
        valorProposto: 2000,
        status: 'ENVIADA',
        arquivadaEm: new Date(),
      },
    })
    archivedId = archived.id

    const otherResponsavel = await prisma.usuario.create({
      data: {
        tenantId: otherTenantId,
        nome: 'Corretor Outro',
        email: `corretor-outro-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    const otherImovel = await prisma.imovel.create({
      data: {
        tenantId: otherTenantId,
        responsavelId: otherResponsavel.id,
        titulo: 'Imóvel Outro',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 1500,
        status: 'PUBLISHED',
        publicadoEm: new Date(),
      },
    })
    const otherInquiry = await prisma.oportunidade.create({
      data: {
        tenantId: otherTenantId,
        imovelId: otherImovel.id,
        interessadoNome: 'De Outro Tenant',
        interessadoEmail: `outro-${randomUUID()}@exemplo.com`,
        valorProposto: 1500,
        status: 'ENVIADA',
      },
    })
    otherTenantInquiryId = otherInquiry.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(query = '', token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/marketplace/inquiries${query}`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    })
  }

  it('retorna 200 e apenas as propostas ativas do tenant do ator (exclui arquivadas e de outros tenants)', async () => {
    const response = await GET(buildRequest('', actorToken))
    const json = await response.json()

    expect(response.status).toBe(200)
    const ids = json.inquiries.map((inquiry: { id: string }) => inquiry.id)
    expect(ids).toContain(activeId)
    expect(ids).not.toContain(archivedId)
    expect(ids).not.toContain(otherTenantInquiryId)
  })

  it('inclui as arquivadas quando includeArchived=true', async () => {
    const response = await GET(buildRequest('?includeArchived=true', actorToken))
    const json = await response.json()

    const ids = json.inquiries.map((inquiry: { id: string }) => inquiry.id)
    expect(ids).toContain(activeId)
    expect(ids).toContain(archivedId)
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest())

    expect(response.status).toBe(401)
  })

  it('retorna 400 quando o status do filtro é inválido', async () => {
    const response = await GET(buildRequest('?status=FECHADA', actorToken))

    expect(response.status).toBe(400)
  })
})
