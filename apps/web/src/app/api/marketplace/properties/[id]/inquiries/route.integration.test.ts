import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { POST } from './route'

describe('POST /api/marketplace/properties/[id]/inquiries (integração)', () => {
  let tenantId: string
  let publishedId: string
  let draftId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária Inquiry', slug: `mkt-inquiry-${randomUUID()}` },
    })
    tenantId = tenant.id

    const responsavel = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })

    const published = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: responsavel.id,
        titulo: 'Sala comercial publicada',
        finalidade: 'ALUGUEL',
        tipo: 'sala',
        valor: 1800,
        status: 'PUBLISHED',
        publicadoEm: new Date(),
      },
    })
    publishedId = published.id

    const draft = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: responsavel.id,
        titulo: 'Sala em rascunho',
        finalidade: 'ALUGUEL',
        tipo: 'sala',
        valor: 2000,
        status: 'DRAFT',
      },
    })
    draftId = draft.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(id: string, body?: unknown): NextRequest {
    return new NextRequest(`http://localhost/api/marketplace/properties/${id}/inquiries`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('cria uma oportunidade (lead) no tenant do imóvel com status ENVIADA', async () => {
    const response = await POST(
      buildRequest(publishedId, {
        interessadoNome: 'Maria Silva',
        interessadoEmail: 'maria@exemplo.com',
        interessadoTelefone: '(41) 99999-9999',
        observacoes: 'Gostaria de agendar uma visita.',
      }),
      { params: { id: publishedId } },
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.inquiry.status).toBe('ENVIADA')
    expect(json.inquiry.imovelId).toBe(publishedId)

    const oportunidade = await prisma.oportunidade.findUnique({
      where: { id: json.inquiry.id },
    })
    expect(oportunidade).not.toBeNull()
    expect(oportunidade?.tenantId).toBe(tenantId)
    expect(oportunidade?.status).toBe('ENVIADA')
    expect(oportunidade?.interessadoEmail).toBe('maria@exemplo.com')
    // valorProposto assume o valor anunciado (1800) quando não informado
    expect(oportunidade?.valorProposto.toString()).toBe('1800')
  })

  it('retorna 404 e não cria oportunidade para um imóvel em rascunho', async () => {
    const response = await POST(
      buildRequest(draftId, {
        interessadoNome: 'João',
        interessadoEmail: 'joao@exemplo.com',
      }),
      { params: { id: draftId } },
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('PROPERTY_NOT_FOUND')

    const count = await prisma.oportunidade.count({ where: { imovelId: draftId } })
    expect(count).toBe(0)
  })

  it('retorna 400 quando o corpo é inválido (e-mail ausente)', async () => {
    const response = await POST(buildRequest(publishedId, { interessadoNome: 'Sem Email' }), {
      params: { id: publishedId },
    })

    expect(response.status).toBe(400)
  })
})
