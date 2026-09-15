import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST } from '../../../../opportunities/[id]/respond/route'

describe('POST /api/crm/opportunities/[id]/respond (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let imovelId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária CRM Respond', slug: `crm-respond-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { nome: 'Outra Imobiliária', slug: `crm-respond-other-${randomUUID()}` },
    })
    otherTenantId = other.id

    // ADMIN — o escopo por AGENT já é coberto nos testes unitários do use-case e na suíte de
    // integração de /api/crm/opportunities (list/create).
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

  async function createOpportunity(status: 'RASCUNHO' | 'ENVIADA' | 'ACEITA' = 'ENVIADA') {
    return prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId,
        interessadoNome: 'Maria',
        interessadoEmail: `maria-${randomUUID()}@exemplo.com`,
        valorProposto: 2500,
        status,
      },
    })
  }

  function buildRequest(id: string, body: unknown, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/opportunities/${id}/respond`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  }

  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  it('ACEITAR move a oportunidade para ACEITA e persiste a atividade PROPOSTA_RESPONDIDA', async () => {
    const opportunity = await createOpportunity('ENVIADA')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'ACEITAR' }, actorToken),
      context(opportunity.id),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.opportunity.status).toBe('ACEITA')
    expect(json.activity.type).toBe('PROPOSTA_RESPONDIDA')
    expect(json.activity.newStatus).toBe('ACEITA')

    const persisted = await prisma.atividadeOportunidade.findUnique({
      where: { id: json.activity.id },
    })
    expect(persisted).not.toBeNull()
    expect(persisted?.descricao).toBe('Proposta aceita.')
  })

  it('RECUSAR com mensagem customizada usa a mensagem como descrição da atividade', async () => {
    const opportunity = await createOpportunity('ENVIADA')

    const response = await POST(
      buildRequest(
        opportunity.id,
        { action: 'RECUSAR', message: 'Valor abaixo do mínimo aceito.' },
        actorToken,
      ),
      context(opportunity.id),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.opportunity.status).toBe('RECUSADA')
    expect(json.activity.description).toBe('Valor abaixo do mínimo aceito.')
  })

  it('SOLICITAR_INFORMACOES move a oportunidade para EM_NEGOCIACAO', async () => {
    const opportunity = await createOpportunity('ENVIADA')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'SOLICITAR_INFORMACOES' }, actorToken),
      context(opportunity.id),
    )
    const json = await response.json()

    expect(json.opportunity.status).toBe('EM_NEGOCIACAO')
  })

  it('retorna 409 ao tentar responder um rascunho — ainda não foi enviado', async () => {
    const opportunity = await createOpportunity('RASCUNHO')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'ACEITAR' }, actorToken),
      context(opportunity.id),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('OPPORTUNITY_NOT_ANSWERABLE')
  })

  it('retorna 409 ao tentar responder uma oportunidade já aceita', async () => {
    const opportunity = await createOpportunity('ACEITA')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'RECUSAR' }, actorToken),
      context(opportunity.id),
    )

    expect(response.status).toBe(409)
  })

  it('retorna 400 para uma action inválida', async () => {
    const opportunity = await createOpportunity('ENVIADA')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'APROVAR' }, actorToken),
      context(opportunity.id),
    )

    expect(response.status).toBe(400)
  })

  it('retorna 401 sem Authorization header', async () => {
    const opportunity = await createOpportunity('ENVIADA')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'ACEITAR' }),
      context(opportunity.id),
    )

    expect(response.status).toBe(401)
  })
})
