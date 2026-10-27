import { PrismaAgendaEventRepository } from '@server/agenda/infrastructure/prisma-agenda-event.repository'
import { GET as GET_EVENT } from '../../events/[id]/route'
import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { createAgendaFixture } from '@server/agenda/tests/fixtures/agenda-database'
import { GET } from '../../properties/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

const tenants: string[] = []
const tokens = new JoseTokenService()
let ownerToken: string, agentToken: string, propertyOwnerToken: string, renterToken: string
let ownPropertyId: string, foreignPropertyId: string
let tenantId: string
beforeAll(async () => {
  const fixture = await createAgendaFixture()
  tenants.push(fixture.tenantId)
  tenantId = fixture.tenantId
  const foreign = await createAgendaFixture()
  tenants.push(foreign.tenantId)
  const suffix = randomUUID()
  const agent = await prisma.usuario.create({
    data: {
      tenantId,
      nome: 'Corretor',
      email: `agent-${suffix}@example.test`,
      senhaHash: 'test-only',
      papel: 'AGENT',
    },
  })
  const propertyOwner = await prisma.usuario.create({
    data: {
      tenantId,
      nome: 'Proprietário',
      email: `owner-${suffix}@example.test`,
      senhaHash: 'test-only',
      papel: 'PROPERTY_OWNER',
    },
  })
  const renter = await prisma.usuario.create({
    data: {
      tenantId: foreign.tenantId,
      nome: 'Locatário',
      email: `renter-${suffix}@example.test`,
      senhaHash: 'test-only',
      papel: 'RENTER',
    },
  })
  const manager = await prisma.usuario.findUniqueOrThrow({ where: { id: fixture.userId } })
  ownerToken = await tokens.sign(manager)
  agentToken = await tokens.sign(agent)
  propertyOwnerToken = await tokens.sign(propertyOwner)
  renterToken = await tokens.sign(renter)
  const own = await prisma.imovel.create({
    data: {
      tenantId,
      responsavelId: agent.id,
      proprietarioId: propertyOwner.id,
      titulo: 'Imóvel autorizado',
      tipo: 'APARTAMENTO',
      finalidade: 'ALUGUEL',
      valor: 1000,
    },
  })
  ownPropertyId = own.id
  for (let index = 0; index < 26; index++)
    await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: fixture.userId,
        titulo: `Opção ${String(index).padStart(2, '0')}`,
        tipo: 'APARTAMENTO',
        finalidade: 'VENDA',
        valor: 100000,
      },
    })
  const other = await prisma.imovel.create({
    data: {
      tenantId: foreign.tenantId,
      responsavelId: foreign.userId,
      titulo: 'Imóvel privado de outro tenant',
      tipo: 'APARTAMENTO',
      finalidade: 'VENDA',
      valor: 100000,
    },
  })
  foreignPropertyId = other.id
  const opportunity = await prisma.oportunidade.create({
    data: {
      tenantId,
      imovelId: own.id,
      responsavelId: await propertyResponsibleId(prisma, own.id),
      interessadoNome: renter.nome,
      interessadoEmail: renter.email,
      valorProposto: 1000,
      status: 'ACEITA',
    },
  })
  await prisma.contrato.create({
    data: {
      tenantId,
      imovelId: own.id,
      oportunidadeOrigemId: opportunity.id,
      codigo: randomUUID(),
      valor: 1000,
      diaVencimento: 5,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2032-01-01'),
      indiceReajuste: 'IPCA',
      tipoGarantia: 'CAUCAO',
      status: 'ATIVO',
      partes: {
        create: {
          papel: 'LOCATARIO',
          nome: renter.nome,
          cpf: '00000000000',
          email: renter.email,
          usuarioId: renter.id,
        },
      },
    },
  })
})
afterAll(async () => {
  for (const id of tenants) await prisma.tenant.delete({ where: { id } })
  await prisma.$disconnect()
})
async function page(token: string, query = '') {
  return GET(
    new NextRequest(`http://localhost/api/agenda/properties${query}`, {
      headers: { authorization: `Bearer ${token}` },
    }),
  )
}

describe('busca mínima e autorizada de imóveis de Agenda', () => {
  it('pagina os dados sem revelar registros ou contagens de outro tenant', async () => {
    const first = await (await page(ownerToken, '?pageSize=25')).json(),
      second = await (await page(ownerToken, '?pageSize=25&page=2')).json()
    expect(first.total).toBe(27)
    expect(first.items).toHaveLength(25)
    expect(second.items).toHaveLength(2)
    expect(
      [...first.items, ...second.items].every(
        (item: { id: string }) => item.id !== foreignPropertyId,
      ),
    ).toBe(true)
    expect(Object.keys(first.items[0]).sort()).toEqual(['id', 'label'])
  })
  it.each(['agent', 'owner', 'renter'])('aplica a regra de acesso do %s', async (role) => {
    const token =
      role === 'agent' ? agentToken : role === 'owner' ? propertyOwnerToken : renterToken
    const response = await page(token)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.items.map((item: { id: string }) => item.id)).toEqual([ownPropertyId])
    expect(body.total).toBe(1)
  })
  it('busca no servidor e rejeita campos extras ou paginação inválida', async () => {
    const body = await (await page(ownerToken, '?search=autorizado')).json()
    expect(body.total).toBe(1)
    expect((await page(ownerToken, '?tenantId=forged')).status).toBe(400)
    expect((await page(ownerToken, '?page=0')).status).toBe(400)
    expect((await page(ownerToken, '?pageSize=101')).status).toBe(400)
  })
})

it('não revela o resumo de um imóvel sem contrato na visão reduzida de um locatário vinculado ao evento', async () => {
  const property = await prisma.imovel.findFirstOrThrow({ where: { tenantId, titulo: 'Opção 00' } })
  const manager = await prisma.usuario.findFirstOrThrow({ where: { tenantId, papel: 'OWNER' } })
  const renter = await prisma.usuario.findFirstOrThrow({
    where: { papel: 'RENTER', tenantId: { in: tenants } },
  })
  const event = await new PrismaAgendaEventRepository().create(
    {
      tenantId,
      responsavelId: manager.id,
      criadoPorId: manager.id,
      imovelId: property.id,
      titulo: 'Evento vinculado',
      tipo: 'MEETING',
      inicio: new Date('2031-03-01T15:00:00Z'),
      fim: new Date('2031-03-01T16:00:00Z'),
      participanteNome: 'Contato privado',
      participanteTelefone: '11999999999',
      notas: 'Nota privada',
    },
    { donoEmail: renter.email },
  )
  const response = await GET_EVENT(
    new NextRequest(`http://localhost/api/agenda/events/${event.id}`, {
      headers: { authorization: `Bearer ${renterToken}` },
    }),
    { params: Promise.resolve({ id: event.id }) },
  )
  expect(response.status).toBe(200)
  const body = await response.json()
  expect(body.event.propertyLabel).toBeNull()
  expect(body.event).not.toHaveProperty('createdBy')
  expect(body.event).not.toHaveProperty('notes')
})
