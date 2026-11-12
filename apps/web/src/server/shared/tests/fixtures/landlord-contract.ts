import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'

const tokens = new JoseTokenService()

export function landlordRequest(path: string, token: string, body?: unknown, method?: string) {
  return new NextRequest(`http://localhost/api/${path}`, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

export const routeContext = (id: string) => ({ params: Promise.resolve({ id }) })

export async function createLandlordTenant(
  tenantIds: string[],
  accountType: 'AGENCY' | 'INDIVIDUAL',
  name: string,
) {
  const row = await prisma.tenant.create({ data: { name, slug: randomUUID(), accountType } })
  tenantIds.push(row.id)
  return row
}

export async function createLandlordUser(
  tenantId: string,
  role: 'AGENT' | 'OWNER' | 'RENTER',
  email = `${randomUUID()}@landlord.test`,
) {
  const row = await prisma.user.create({
    data: { tenantId, role, name: role, email, passwordHash: 'test' },
  })
  return { ...row, token: await tokens.sign(row) }
}

export async function createLandlordScenario(tenantIds: string[]) {
  const landlordTenant = await createLandlordTenant(tenantIds, 'INDIVIDUAL', 'Paula')
  const landlord = await createLandlordUser(landlordTenant.id, 'OWNER')
  const ownProperty = await prisma.property.create({
    data: {
      tenantId: landlordTenant.id,
      responsibleId: landlord.id,
      title: 'Casa própria da Paula',
      purpose: 'RENT',
      type: 'HOUSE',
      price: 2000,
    },
  })
  const agency = await createLandlordTenant(tenantIds, 'AGENCY', 'Imobiliária Parceira')
  const admin = await createLandlordUser(agency.id, 'OWNER')
  const agent = await createLandlordUser(agency.id, 'AGENT')
  const property = await prisma.property.create({
    data: {
      tenantId: agency.id,
      responsibleId: agent.id,
      title: 'Apartamento da Paula',
      purpose: 'RENT',
      type: 'APARTMENT',
      price: 3000,
      status: 'RENTED',
    },
  })
  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId: agency.id,
      propertyId: property.id,
      responsibleId: agent.id,
      interestedName: 'Lia',
      interestedEmail: 'lia@landlord.test',
      proposedValue: 3000,
      status: 'ACCEPTED',
    },
  })
  const contract = await prisma.contract.create({
    data: {
      tenantId: agency.id,
      propertyId: property.id,
      sourceOpportunityId: opportunity.id,
      code: randomUUID(),
      amount: 3000,
      dueDay: 10,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      adjustmentIndex: 'IPCA',
      guaranteeType: 'DEPOSIT',
      status: 'ACTIVE',
      parties: {
        create: [
          { role: 'LANDLORD', name: 'Paula', cpf: '00000000000', email: landlord.email },
          { role: 'RENTER', name: 'Lia', cpf: '11111111111', email: 'lia@landlord.test' },
        ],
      },
    },
    include: { parties: true },
  })
  const charge = await prisma.charge.create({
    data: {
      tenantId: agency.id,
      contractId: contract.id,
      type: 'RECEIVABLE',
      code: randomUUID(),
      amount: 3000,
      dueDate: new Date('2026-10-10'),
      status: 'PENDING',
    },
  })
  const ticket = await prisma.maintenanceTicket.create({
    data: {
      tenantId: agency.id,
      propertyId: property.id,
      contractId: contract.id,
      openedById: admin.id,
      openedByName: admin.name,
      title: 'Vazamento aberto pela locatária',
      description: 'Pia da cozinha',
      category: 'PLUMBING',
    },
  })
  const party = contract.parties.find((candidate) => candidate.role === 'LANDLORD')!
  return { landlord, ownProperty, agency, admin, agent, property, contract, charge, ticket, party }
}

export async function linkLandlordAccount(partyId: string, userId: string) {
  await prisma.contractParty.update({ where: { id: partyId }, data: { userId } })
}

export async function removeLandlordTenants(tenantIds: string[]) {
  for (const tenantId of [...tenantIds].reverse())
    await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => undefined)
}
