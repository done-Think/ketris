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
  const agent = await prisma.user.create({
    data: {
      tenantId,
      name: 'Corretor',
      email: `agent-${suffix}@example.test`,
      passwordHash: 'test-only',
      role: 'AGENT',
    },
  })
  const propertyOwner = await prisma.user.create({
    data: {
      tenantId,
      name: 'Proprietário',
      email: `owner-${suffix}@example.test`,
      passwordHash: 'test-only',
      role: 'PROPERTY_OWNER',
    },
  })
  const renter = await prisma.user.create({
    data: {
      tenantId: foreign.tenantId,
      name: 'Locatário',
      email: `renter-${suffix}@example.test`,
      passwordHash: 'test-only',
      role: 'RENTER',
    },
  })
  const manager = await prisma.user.findUniqueOrThrow({ where: { id: fixture.userId } })
  ownerToken = await tokens.sign(manager)
  agentToken = await tokens.sign(agent)
  propertyOwnerToken = await tokens.sign(propertyOwner)
  renterToken = await tokens.sign(renter)
  const own = await prisma.property.create({
    data: {
      tenantId,
      responsibleId: agent.id,
      ownerId: propertyOwner.id,
      title: 'Imóvel autorizado',
      type: 'APARTMENT',
      purpose: 'RENT',
      price: 1000,
    },
  })
  ownPropertyId = own.id
  for (let index = 0; index < 26; index++)
    await prisma.property.create({
      data: {
        tenantId,
        responsibleId: fixture.userId,
        title: `Opção ${String(index).padStart(2, '0')}`,
        type: 'APARTMENT',
        purpose: 'SALE',
        price: 100000,
      },
    })
  const other = await prisma.property.create({
    data: {
      tenantId: foreign.tenantId,
      responsibleId: foreign.userId,
      title: 'Imóvel privado de outro tenant',
      type: 'APARTMENT',
      purpose: 'SALE',
      price: 100000,
    },
  })
  foreignPropertyId = other.id
  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId,
      propertyId: own.id,
      responsibleId: await propertyResponsibleId(prisma, own.id),
      interestedName: renter.name,
      interestedEmail: renter.email,
      proposedValue: 1000,
      status: 'ACCEPTED',
    },
  })
  await prisma.contract.create({
    data: {
      tenantId,
      propertyId: own.id,
      sourceOpportunityId: opportunity.id,
      code: randomUUID(),
      amount: 1000,
      dueDay: 5,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2032-01-01'),
      adjustmentIndex: 'IPCA',
      guaranteeType: 'DEPOSIT',
      status: 'ACTIVE',
      parties: {
        create: {
          role: 'RENTER',
          name: renter.name,
          cpf: '00000000000',
          email: renter.email,
          userId: renter.id,
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
  const property = await prisma.property.findFirstOrThrow({
    where: { tenantId, title: 'Opção 00' },
  })
  const manager = await prisma.user.findFirstOrThrow({ where: { tenantId, role: 'OWNER' } })
  const renter = await prisma.user.findFirstOrThrow({
    where: { role: 'RENTER', tenantId: { in: tenants } },
  })
  const event = await new PrismaAgendaEventRepository().create(
    {
      tenantId,
      responsibleId: manager.id,
      createdById: manager.id,
      propertyId: property.id,
      title: 'Evento vinculado',
      type: 'MEETING',
      start: new Date('2031-03-01T15:00:00Z'),
      end: new Date('2031-03-01T16:00:00Z'),
      participantName: 'Contato privado',
      participantPhone: '11999999999',
      notes: 'Nota privada',
    },
    { ownerEmail: renter.email },
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
