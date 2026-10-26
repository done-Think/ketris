import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { GET } from '../../opportunities/route'

const tenants: string[] = []
let ownerToken: string, agentToken: string, renterToken: string
let eligibleId: string, ownerId: string

beforeAll(async () => {
  const tenant = await prisma.tenant.create({
    data: { nome: 'Catálogo Contracts', slug: `contracts-catalog-${randomUUID()}` },
  })
  const foreign = await prisma.tenant.create({
    data: { nome: 'Outro tenant', slug: `contracts-catalog-${randomUUID()}` },
  })
  tenants.push(tenant.id, foreign.id)
  const createUser = (papel: 'OWNER' | 'AGENT' | 'RENTER' | 'PROPERTY_OWNER') =>
    prisma.usuario.create({
      data: {
        tenantId: tenant.id,
        nome: 'Pessoa do catálogo',
        email: `${randomUUID()}@example.test`,
        senhaHash: 'test-only',
        papel,
      },
    })
  const [owner, agent, renter, propertyOwner] = await Promise.all([
    createUser('OWNER'),
    createUser('AGENT'),
    createUser('RENTER'),
    createUser('PROPERTY_OWNER'),
  ])
  const tokens = new JoseTokenService()
  ownerToken = await tokens.sign(owner)
  agentToken = await tokens.sign(agent)
  renterToken = await tokens.sign(renter)
  ownerId = propertyOwner.id
  const property = await prisma.imovel.create({
    data: {
      tenantId: tenant.id,
      responsavelId: agent.id,
      proprietarioId: propertyOwner.id,
      titulo: 'Apartamento elegível',
      finalidade: 'ALUGUEL',
      tipo: 'APARTAMENTO',
      valor: 2500,
    },
  })
  const otherProperty = await prisma.imovel.create({
    data: {
      tenantId: tenant.id,
      responsavelId: owner.id,
      titulo: 'Outra responsabilidade',
      finalidade: 'ALUGUEL',
      tipo: 'CASA',
      valor: 2000,
    },
  })
  const createOpportunity = (imovelId: string, status: 'ACEITA' | 'ENVIADA', archived = false) =>
    prisma.oportunidade.create({
      data: {
        tenantId: tenant.id,
        imovelId,
        status,
        interessadoNome: 'Interessado do catálogo',
        interessadoEmail: `${randomUUID()}@example.test`,
        valorProposto: 2450.75,
        arquivadaEm: archived ? new Date() : null,
      },
    })
  eligibleId = (await createOpportunity(property.id, 'ACEITA')).id
  await createOpportunity(property.id, 'ENVIADA')
  await createOpportunity(property.id, 'ACEITA', true)
  await createOpportunity(otherProperty.id, 'ACEITA')
  const linked = await createOpportunity(property.id, 'ACEITA')
  await prisma.contrato.create({
    data: {
      tenantId: tenant.id,
      imovelId: property.id,
      oportunidadeOrigemId: linked.id,
      codigo: `CAT-${randomUUID()}`,
      valor: 2450.75,
      diaVencimento: 5,
      dataInicio: new Date('2031-01-01'),
      dataFim: new Date('2032-01-01'),
      indiceReajuste: 'IPCA',
      tipoGarantia: 'CAUCAO',
    },
  })
  const foreignUser = await prisma.usuario.create({
    data: {
      tenantId: foreign.id,
      nome: 'Outra gestão',
      email: `${randomUUID()}@example.test`,
      senhaHash: 'test-only',
      papel: 'OWNER',
    },
  })
  const foreignProperty = await prisma.imovel.create({
    data: {
      tenantId: foreign.id,
      responsavelId: foreignUser.id,
      titulo: 'Privado',
      finalidade: 'ALUGUEL',
      tipo: 'CASA',
      valor: 1000,
    },
  })
  await prisma.oportunidade.create({
    data: {
      tenantId: foreign.id,
      imovelId: foreignProperty.id,
      interessadoNome: 'Pessoa privada',
      interessadoEmail: 'private@example.test',
      valorProposto: 1000,
      status: 'ACEITA',
    },
  })
})
afterAll(async () => {
  for (const id of tenants) {
    await prisma.contrato.deleteMany({ where: { tenantId: id } })
    await prisma.tenant.delete({ where: { id } })
  }
})
function request(token: string, query = '') {
  return new NextRequest(`http://localhost/api/contracts/opportunities${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
it('pagina e busca somente propostas aceitas, não arquivadas e sem contrato no tenant do gestor', async () => {
  const page = await GET(request(ownerToken, '?page=1&pageSize=1'))
  expect(page.status).toBe(200)
  const body = await page.json()
  expect(body.totalCount).toBe(2)
  expect(body.items).toHaveLength(1)
  const second = await (await GET(request(ownerToken, '?page=2&pageSize=1'))).json()
  expect(second.items).toHaveLength(1)
  expect(second.items[0].id).not.toBe(body.items[0].id)
  const filtered = await (
    await GET(request(ownerToken, '?search=Apartamento%20eleg%C3%ADvel'))
  ).json()
  expect(filtered.items.map((item: { id: string }) => item.id)).toEqual([eligibleId])
  expect(filtered.items[0]).toMatchObject({
    proposedValue: 2450.75,
    owner: { id: ownerId, name: 'Pessoa do catálogo' },
  })
  expect(filtered.items[0]).not.toHaveProperty('senhaHash')
  expect(filtered.items[0]).not.toHaveProperty('tenantId')
})
it('restringe o corretor aos imóveis sob sua responsabilidade', async () => {
  const response = await GET(request(agentToken))
  expect(response.status).toBe(200)
  const body = await response.json()
  expect(body.totalCount).toBe(1)
  expect(body.items.map((item: { id: string }) => item.id)).toEqual([eligibleId])
})
it('recusa locatários e campos de query desconhecidos', async () => {
  expect((await GET(request(renterToken))).status).toBe(403)
  expect((await GET(request(ownerToken, '?tenantId=other'))).status).toBe(400)
  expect((await GET(request(ownerToken, '?page=0'))).status).toBe(400)
})
