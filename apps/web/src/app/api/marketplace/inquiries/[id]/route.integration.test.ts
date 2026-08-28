import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { DELETE, GET, PATCH, PUT } from './route'

describe('/api/marketplace/inquiries/[id] (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let imovelId: string
  let otherTenantInquiryId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária Inquiry Id', slug: `mkt-inq-id-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { nome: 'Outra', slug: `mkt-inq-id-other-${randomUUID()}` },
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

  async function seedInquiry(overrides?: { arquivadaEm?: Date }) {
    const inquiry = await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId,
        interessadoNome: 'Maria',
        interessadoEmail: `maria-${randomUUID()}@exemplo.com`,
        interessadoTelefone: '(41) 90000-0000',
        valorProposto: 2000,
        status: 'ENVIADA',
        arquivadaEm: overrides?.arquivadaEm,
      },
    })
    return inquiry.id
  }

  function buildRequest(id: string, method: string, body?: unknown, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/marketplace/inquiries/${id}`, {
      method,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  function ctx(id: string) {
    return { params: { id } }
  }

  it('GET retorna 200 para uma proposta do tenant do ator', async () => {
    const id = await seedInquiry()
    const response = await GET(buildRequest(id, 'GET', undefined, actorToken), ctx(id))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.inquiry.id).toBe(id)
  })

  it('GET retorna 401 sem token', async () => {
    const id = await seedInquiry()
    const response = await GET(buildRequest(id, 'GET'), ctx(id))

    expect(response.status).toBe(401)
  })

  it('GET retorna 404 (opaco) para uma proposta de outro tenant', async () => {
    const response = await GET(
      buildRequest(otherTenantInquiryId, 'GET', undefined, actorToken),
      ctx(otherTenantInquiryId),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('INQUIRY_NOT_FOUND')
  })

  it('PUT substitui a proposta e redefine campos opcionais omitidos', async () => {
    const id = await seedInquiry()
    const response = await PUT(
      buildRequest(
        id,
        'PUT',
        {
          interessadoNome: 'Maria Atualizada',
          interessadoEmail: 'maria.nova@exemplo.com',
          valorProposto: 2200,
          status: 'EM_NEGOCIACAO',
        },
        actorToken,
      ),
      ctx(id),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.inquiry.interessadoNome).toBe('Maria Atualizada')
    expect(json.inquiry.status).toBe('EM_NEGOCIACAO')
    // telefone omitido no PUT deve ser redefinido para null
    expect(json.inquiry.interessadoTelefone).toBeNull()
  })

  it('PUT retorna 400 quando falta um campo-núcleo', async () => {
    const id = await seedInquiry()
    const response = await PUT(
      buildRequest(id, 'PUT', { interessadoNome: 'X' }, actorToken),
      ctx(id),
    )

    expect(response.status).toBe(400)
  })

  it('PATCH atualiza parcialmente (só status)', async () => {
    const id = await seedInquiry()
    const response = await PATCH(
      buildRequest(id, 'PATCH', { status: 'ACEITA' }, actorToken),
      ctx(id),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.inquiry.status).toBe('ACEITA')
    expect(json.inquiry.interessadoTelefone).toBe('(41) 90000-0000')
  })

  it('PATCH retorna 400 com corpo vazio', async () => {
    const id = await seedInquiry()
    const response = await PATCH(buildRequest(id, 'PATCH', {}, actorToken), ctx(id))

    expect(response.status).toBe(400)
  })

  it('DELETE (soft) arquiva a proposta e retorna 200 com arquivadaEm preenchido', async () => {
    const id = await seedInquiry()
    const response = await DELETE(buildRequest(id, 'DELETE', undefined, actorToken), ctx(id))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.inquiry.arquivadaEm).not.toBeNull()

    const row = await prisma.oportunidade.findUnique({ where: { id } })
    expect(row).not.toBeNull()
    expect(row?.arquivadaEm).not.toBeNull()
  })

  it('DELETE permanent=true remove o registro do banco e retorna 204', async () => {
    const id = await seedInquiry()

    const response = await DELETE(
      new NextRequest(`http://localhost/api/marketplace/inquiries/${id}?permanent=true`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${actorToken}` },
      }),
      ctx(id),
    )

    expect(response.status).toBe(204)

    const row = await prisma.oportunidade.findUnique({ where: { id } })
    expect(row).toBeNull()
  })

  it('DELETE retorna 404 para uma proposta de outro tenant', async () => {
    const response = await DELETE(
      buildRequest(otherTenantInquiryId, 'DELETE', undefined, actorToken),
      ctx(otherTenantInquiryId),
    )

    expect(response.status).toBe(404)
  })
})
