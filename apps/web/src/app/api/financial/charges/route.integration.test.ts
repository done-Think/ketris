import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST as registerPayment } from './[id]/payment/route'
import { GET as getCharge, PATCH as patchCharge } from './[id]/route'
import { GET, POST } from './route'

describe('/api/financial/charges (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let actorToken: string
  let renterToken: string
  let contractId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Financial', slug: `financial-${randomUUID()}` },
    })
    tenantId = tenant.id

    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
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
      vinculoAprovadoEm: actor.vinculoAprovadoEm,
    })

    const renter = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Locatário Teste',
        email: `locatario-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'RENTER',
      },
    })
    renterToken = await tokenService.sign({
      id: renter.id,
      tenantId: renter.tenantId,
      nome: renter.nome,
      email: renter.email,
      papel: renter.papel,
      ativo: renter.ativo,
      vinculoAprovadoEm: renter.vinculoAprovadoEm,
    })

    const property = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: actor.id,
        titulo: 'Apartamento Batel',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 2500,
        status: 'RENTED',
      },
    })

    const opportunity = await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId: property.id,
        interessadoNome: 'Mariana Souza',
        interessadoEmail: 'mariana@example.com',
        valorProposto: 2500,
        status: 'ACEITA',
      },
    })

    const contract = await prisma.contrato.create({
      data: {
        tenantId,
        imovelId: property.id,
        oportunidadeOrigemId: opportunity.id,
        codigo: `CTR-${randomUUID()}`,
        tipo: 'RESIDENCIAL',
        valor: 2500,
        diaVencimento: 5,
        dataInicio: new Date('2026-10-01'),
        dataFim: new Date('2027-10-01'),
        indiceReajuste: 'IGPM',
        tipoGarantia: 'CAUCAO',
        status: 'ATIVO',
        partes: {
          create: [
            {
              papel: 'LOCATARIO',
              nome: 'Mariana Souza',
              cpf: '22222222222',
              email: 'mariana@example.com',
            },
          ],
        },
      },
    })
    contractId = contract.id
  })

  afterAll(async () => {
    if (tenantId) {
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    await prisma.$disconnect()
  })

  function buildRequest(url: string, method: string, body?: unknown, token?: string): NextRequest {
    return new NextRequest(url, {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest('http://localhost/api/financial/charges', 'GET'))

    expect(response.status).toBe(401)
  })

  it('retorna 403 quando um RENTER tenta criar cobrança', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/financial/charges',
        'POST',
        {
          description: 'Conta de luz',
          type: 'A_PAGAR',
          amount: 180,
          dueDate: '2026-10-12',
          status: 'PENDENTE',
        },
        renterToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('retorna 400 ao criar cobrança avulsa sem descrição', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/financial/charges',
        'POST',
        { type: 'A_PAGAR', amount: 180, dueDate: '2026-10-12', status: 'PENDENTE' },
        actorToken,
      ),
    )

    expect(response.status).toBe(400)
  })

  it('retorna 404 ao criar cobrança vinculada a um contrato inexistente no tenant', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/financial/charges',
        'POST',
        {
          contractId: 'contract-missing',
          type: 'A_RECEBER',
          amount: 2500,
          dueDate: '2026-11-05',
          status: 'PENDENTE',
        },
        actorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('CHARGE_CONTRACT_NOT_FOUND')
  })

  let avulsaChargeId: string
  let linkedChargeId: string

  it('cria uma cobrança avulsa (sem contrato) com código sequencial', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/financial/charges',
        'POST',
        {
          description: 'Conta de luz',
          type: 'A_PAGAR',
          amount: 180.5,
          dueDate: '2026-10-12',
          status: 'PENDENTE',
        },
        actorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.charge.code).toMatch(/^COB-\d{4}-\d{4}$/)
    expect(json.charge.contractId).toBeNull()
    expect(json.charge.description).toBe('Conta de luz')
    expect(json.charge.amount).toBe(180.5)
    expect(json.charge.status).toBe('PENDENTE')

    avulsaChargeId = json.charge.id
  })

  it('cria uma cobrança vinculada a um contrato, herdando imóvel e locatário', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/financial/charges',
        'POST',
        { contractId, type: 'A_RECEBER', amount: 2500, dueDate: '2026-11-05', status: 'PENDENTE' },
        actorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.charge.contractId).toBe(contractId)
    expect(json.charge.propertyTitle).toBe('Apartamento Batel')
    expect(json.charge.payerName).toBe('Mariana Souza')

    linkedChargeId = json.charge.id
  })

  it('lista as cobranças do tenant, com busca textual por locatário', async () => {
    const response = await GET(
      buildRequest(
        'http://localhost/api/financial/charges?search=Mariana',
        'GET',
        undefined,
        actorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.items.map((item: { id: string }) => item.id)).toContain(linkedChargeId)
    expect(json.items.map((item: { id: string }) => item.id)).not.toContain(avulsaChargeId)
  })

  it('consulta a cobrança avulsa pelo id', async () => {
    const response = await getCharge(
      buildRequest(
        `http://localhost/api/financial/charges/${avulsaChargeId}`,
        'GET',
        undefined,
        actorToken,
      ),
      { params: Promise.resolve({ id: avulsaChargeId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.charge.id).toBe(avulsaChargeId)
  })

  it('retorna 404 ao consultar cobrança de outro tenant/id inexistente', async () => {
    const response = await getCharge(
      buildRequest('http://localhost/api/financial/charges/missing', 'GET', undefined, actorToken),
      { params: Promise.resolve({ id: 'missing' }) },
    )

    expect(response.status).toBe(404)
  })

  it('edita a cobrança sem marcar como paga (edição direta de status ignora PAGA sem pagamento)', async () => {
    const response = await patchCharge(
      buildRequest(
        `http://localhost/api/financial/charges/${avulsaChargeId}`,
        'PATCH',
        {
          description: 'Conta de luz - atualizada',
          type: 'A_PAGAR',
          amount: 200,
          dueDate: '2026-10-15',
          status: 'PAGA',
        },
        actorToken,
      ),
      { params: Promise.resolve({ id: avulsaChargeId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.charge.description).toBe('Conta de luz - atualizada')
    expect(json.charge.amount).toBe(200)
    expect(json.charge.status).toBe('PENDENTE')
    expect(json.charge.paidAt).toBeNull()
  })

  it('registra o pagamento da cobrança avulsa', async () => {
    const response = await registerPayment(
      buildRequest(
        `http://localhost/api/financial/charges/${avulsaChargeId}/payment`,
        'POST',
        { paidAt: '2026-10-14', paymentMethod: 'Boleto' },
        actorToken,
      ),
      { params: Promise.resolve({ id: avulsaChargeId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.charge.status).toBe('PAGA')
    expect(json.charge.paymentMethod).toBe('Boleto')
    expect(json.charge.paidAt).not.toBeNull()
  })

  it('retorna 409 ao tentar pagar uma cobrança já paga', async () => {
    const response = await registerPayment(
      buildRequest(
        `http://localhost/api/financial/charges/${avulsaChargeId}/payment`,
        'POST',
        { paidAt: '2026-10-14', paymentMethod: 'Boleto' },
        actorToken,
      ),
      { params: Promise.resolve({ id: avulsaChargeId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('CHARGE_ALREADY_SETTLED')
  })

  it('edita a cobrança paga para outro status e limpa os dados de pagamento', async () => {
    const response = await patchCharge(
      buildRequest(
        `http://localhost/api/financial/charges/${avulsaChargeId}`,
        'PATCH',
        {
          description: 'Conta de luz - atualizada',
          type: 'A_PAGAR',
          amount: 200,
          dueDate: '2026-10-15',
          status: 'CANCELADA',
        },
        actorToken,
      ),
      { params: Promise.resolve({ id: avulsaChargeId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.charge.status).toBe('CANCELADA')
    expect(json.charge.paymentMethod).toBeNull()
    expect(json.charge.receiptUrl).toBeNull()
    expect(json.charge.paidAt).toBeNull()
  })
})
