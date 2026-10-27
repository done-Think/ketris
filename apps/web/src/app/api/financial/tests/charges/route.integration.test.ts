import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST as registerPayment } from '../../charges/[id]/payment/route'
import {
  DELETE as deleteCharge,
  GET as getCharge,
  PATCH as patchCharge,
} from '../../charges/[id]/route'
import { GET, POST } from '../../charges/route'
import { GET as getSummary } from '../../summary/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

describe('/api/financial/charges (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let actorToken: string
  let renterToken: string
  let agentToken: string
  let contractId: string
  let actorId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Financial', slug: `financial-${randomUUID()}` },
    })
    tenantId = tenant.id

    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Proprietário',
        email: `proprietario-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'OWNER',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      nome: actor.nome,
      email: actor.email,
      papel: actor.papel,
      ativo: actor.ativo,
      vinculoAprovadoEm: actor.vinculoAprovadoEm,
    })

    const agent = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    agentToken = await tokenService.sign({
      id: agent.id,
      tenantId: agent.tenantId,
      nome: agent.nome,
      email: agent.email,
      papel: agent.papel,
      ativo: agent.ativo,
      vinculoAprovadoEm: agent.vinculoAprovadoEm,
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
        tipo: 'APARTAMENTO',
        valor: 2500,
        status: 'RENTED',
      },
    })

    const opportunity = await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId: property.id,
        responsavelId: await propertyResponsibleId(prisma, property.id),
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
    expect(json.charge.status).toBe(
      new Date('2026-10-12T00:00:00.000Z') < new Date(new Date().toISOString().slice(0, 10))
        ? 'ATRASADA'
        : 'PENDENTE',
    )

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

  it.each([
    ['AGENT', () => agentToken],
    ['RENTER', () => renterToken],
  ])('protege leituras e bloqueia alterações de %s sem alterar nada', async (role, token) => {
    const url = `http://localhost/api/financial/charges/${avulsaChargeId}`
    const params = { params: Promise.resolve({ id: avulsaChargeId }) }
    const patchBody = {
      description: 'Alterada sem permissão',
      type: 'A_PAGAR',
      amount: 1,
      dueDate: '2026-10-15',
    }
    const body = { ...patchBody, status: 'PENDENTE' }
    const before = await prisma.cobranca.findUniqueOrThrow({ where: { id: avulsaChargeId } })

    const responses = [
      await GET(buildRequest('http://localhost/api/financial/charges', 'GET', undefined, token())),
      await POST(buildRequest('http://localhost/api/financial/charges', 'POST', body, token())),
      await getCharge(buildRequest(url, 'GET', undefined, token()), params),
      await patchCharge(buildRequest(url, 'PATCH', patchBody, token()), params),
      await registerPayment(
        buildRequest(
          `${url}/payment`,
          'POST',
          { paidAt: '2026-10-14', paymentMethod: 'Boleto' },
          token(),
        ),
        params,
      ),
      await deleteCharge(buildRequest(url, 'DELETE', undefined, token()), params),
    ]

    expect(responses.map((response) => response.status)).toEqual(
      role === 'RENTER' ? [200, 403, 404, 403, 403, 403] : [403, 403, 403, 403, 403, 403],
    )
    if (role === 'RENTER') {
      expect(await responses[0].json()).toMatchObject({ items: [], totalCount: 0 })
    }
    expect(await prisma.cobranca.findUniqueOrThrow({ where: { id: avulsaChargeId } })).toEqual(
      before,
    )
  })

  it('retorna 404 ao consultar cobrança de outro tenant/id inexistente', async () => {
    const response = await getCharge(
      buildRequest('http://localhost/api/financial/charges/missing', 'GET', undefined, actorToken),
      { params: Promise.resolve({ id: 'missing' }) },
    )

    expect(response.status).toBe(404)
  })

  it('recusa trocar o status pela edição', async () => {
    const response = await patchCharge(
      buildRequest(
        `http://localhost/api/financial/charges/${avulsaChargeId}`,
        'PATCH',
        { status: 'PAGA' },
        actorToken,
      ),
      { params: Promise.resolve({ id: avulsaChargeId }) },
    )

    expect(response.status).toBe(400)
  })

  it('edita a cobrança em aberto e registra no histórico', async () => {
    const response = await patchCharge(
      buildRequest(
        `http://localhost/api/financial/charges/${avulsaChargeId}`,
        'PATCH',
        { description: 'Conta de luz - atualizada', amount: 200, dueDate: '2099-10-15' },
        actorToken,
      ),
      { params: Promise.resolve({ id: avulsaChargeId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.charge).toMatchObject({
      description: 'Conta de luz - atualizada',
      amount: 200,
      status: 'PENDENTE',
      paidAt: null,
    })
    const events = await prisma.chargeAuditEvent.findMany({
      where: { chargeId: avulsaChargeId },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.map((event) => event.action)).toEqual(['CREATED', 'UPDATED'])
    expect(events[1].changedFields).toEqual(['descricao', 'valor', 'vencimento'])
  })

  it('registra o pagamento da cobrança avulsa com quem deu baixa', async () => {
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
    expect(json.charge.receipt).toBeNull()
    const stored = await prisma.cobranca.findUniqueOrThrow({ where: { id: avulsaChargeId } })
    expect(stored.pagoPorId).toBe(actorId)
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

  it('trava o valor da cobrança paga, mas deixa corrigir a descrição', async () => {
    const url = `http://localhost/api/financial/charges/${avulsaChargeId}`
    const params = { params: Promise.resolve({ id: avulsaChargeId }) }

    const locked = await patchCharge(
      buildRequest(url, 'PATCH', { amount: 999 }, actorToken),
      params,
    )
    expect(locked.status).toBe(409)
    expect((await locked.json()).error.code).toBe('CHARGE_LOCKED')

    const described = await patchCharge(
      buildRequest(url, 'PATCH', { description: 'Conta de luz de outubro' }, actorToken),
      { params: Promise.resolve({ id: avulsaChargeId }) },
    )
    expect(described.status).toBe(200)
    expect((await described.json()).charge).toMatchObject({
      status: 'PAGA',
      amount: 200,
      description: 'Conta de luz de outubro',
    })
  })

  it('não exclui cobrança que já teve pagamento', async () => {
    const response = await deleteCharge(
      buildRequest(
        `http://localhost/api/financial/charges/${avulsaChargeId}`,
        'DELETE',
        undefined,
        actorToken,
      ),
      { params: Promise.resolve({ id: avulsaChargeId }) },
    )

    expect(response.status).toBe(409)
    expect((await response.json()).error.code).toBe('CHARGE_HAS_MOVEMENT')
  })

  it('retorna 403 quando um RENTER tenta excluir cobrança', async () => {
    const response = await deleteCharge(
      buildRequest(
        `http://localhost/api/financial/charges/${avulsaChargeId}`,
        'DELETE',
        undefined,
        renterToken,
      ),
      { params: Promise.resolve({ id: avulsaChargeId }) },
    )

    expect(response.status).toBe(403)
  })

  it('retorna 404 ao tentar excluir cobrança inexistente', async () => {
    const response = await deleteCharge(
      buildRequest(
        'http://localhost/api/financial/charges/missing',
        'DELETE',
        undefined,
        actorToken,
      ),
      { params: Promise.resolve({ id: 'missing' }) },
    )

    expect(response.status).toBe(404)
  })

  it('exclui cobrança sem movimento e guarda o registro da exclusão', async () => {
    const created = await POST(
      buildRequest(
        'http://localhost/api/financial/charges',
        'POST',
        {
          description: 'Lançada por engano',
          type: 'A_PAGAR',
          amount: 50,
          dueDate: '2099-01-01',
          status: 'AGENDADA',
        },
        actorToken,
      ),
    )
    const { charge } = await created.json()
    const url = `http://localhost/api/financial/charges/${charge.id}`

    const response = await deleteCharge(buildRequest(url, 'DELETE', undefined, actorToken), {
      params: Promise.resolve({ id: charge.id }),
    })

    expect(response.status).toBe(204)
    expect(await prisma.cobranca.findUnique({ where: { id: charge.id } })).toBeNull()
    const deleted = await prisma.chargeAuditEvent.findFirstOrThrow({
      where: { tenantId, chargeCode: charge.code, action: 'DELETED' },
    })
    expect(deleted).toMatchObject({ chargeId: null, actorUserId: actorId, fromStatus: 'AGENDADA' })
  })

  async function createToken(papel: 'OWNER' | 'OWNER') {
    const user = await prisma.usuario.create({
      data: {
        tenantId,
        nome: `Usuário ${papel}`,
        email: `${papel.toLowerCase()}-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel,
      },
    })

    return tokenService.sign({
      id: user.id,
      tenantId: user.tenantId,
      nome: user.nome,
      email: user.email,
      papel: user.papel,
      ativo: user.ativo,
      vinculoAprovadoEm: user.vinculoAprovadoEm,
    })
  }

  it('calcula a taxa de ocupação no resumo financeiro a partir dos imóveis de aluguel', async () => {
    const response = await getSummary(
      buildRequest(
        'http://localhost/api/financial/summary',
        'GET',
        undefined,
        await createToken('OWNER'),
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.occupancyRatePercentage).toBe(100)
  })

  it('libera o resumo financeiro para OWNER', async () => {
    const response = await getSummary(
      buildRequest(
        'http://localhost/api/financial/summary',
        'GET',
        undefined,
        await createToken('OWNER'),
      ),
    )

    expect(response.status).toBe(200)
  })

  it.each([
    ['AGENT', () => agentToken],
    ['RENTER', () => renterToken],
  ])('retorna 403 quando um %s pede o resumo financeiro da imobiliária', async (_, token) => {
    const response = await getSummary(
      buildRequest('http://localhost/api/financial/summary', 'GET', undefined, token()),
    )

    expect(response.status).toBe(403)
  })
})
