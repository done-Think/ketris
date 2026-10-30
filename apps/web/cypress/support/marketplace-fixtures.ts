import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { getDatabaseUrl } from '../../src/server/db/database-url'
import type {
  MarketplaceFixtureInput,
  MarketplaceFixtureResult,
  MarketplaceInquiryEvidence,
} from '../types/marketplace-fixtures'

const slugPrefix = 'marketplace-e2e-'

function isolated() {
  if (
    process.env.KETRIS_E2E_ISOLATED_DB !== '1' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(new URL(getDatabaseUrl()).hostname)
  )
    throw new Error('Marketplace E2E exige banco local isolado.')
}

export async function seedMarketplaceFixtures(
  prisma: PrismaClient,
  { suffix, password }: MarketplaceFixtureInput,
): Promise<MarketplaceFixtureResult> {
  isolated()
  if (!/^[a-z0-9-]+$/.test(suffix)) throw new Error('Identificador inválido.')
  await prisma.authRateLimitBucket.deleteMany({
    where: { key: { startsWith: 'marketplace-inquiry:' } },
  })
  const tenant = await prisma.tenant.create({
    data: { name: 'Marketplace E2E', slug: slugPrefix + suffix, accountType: 'AGENCY' },
  })
  const passwordHash = await bcrypt.hash(password, 10)
  const ownerEmail = 'owner-' + suffix + '@marketplace.example.test'
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Gestora Marketplace E2E',
      email: ownerEmail,
      passwordHash,
      role: 'OWNER',
      emailVerifiedAt: new Date(),
    },
  })
  const brokerName = 'Corretora Marketplace ' + suffix
  const broker = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: brokerName,
      email: 'broker-' + suffix + '@marketplace.example.test',
      passwordHash,
      role: 'AGENT',
      emailVerifiedAt: new Date(),
    },
  })
  await prisma.brokerPublicProfile.create({
    data: {
      userId: broker.id,
      displayName: brokerName,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  })
  const city = 'Cidade E2E ' + suffix
  const propertyTitle = 'Casa Marketplace E2E ' + suffix
  const property = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      responsibleId: broker.id,
      title: propertyTitle,
      description: 'Casa com quintal para o fluxo de proposta E2E.',
      purpose: 'SALE',
      type: 'HOUSE',
      bedrooms: 3,
      bathrooms: 2,
      parkingSpots: 2,
      areaSqm: 140,
      price: 650000,
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() + 60_000),
      address: {
        create: {
          street: 'Rua do Teste',
          number: '42',
          neighborhood: 'Centro',
          city: city,
          state: 'PR',
          zipCode: '80010-000',
        },
      },
    },
  })

  const rental = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      responsibleId: broker.id,
      title: 'Aluguel Marketplace E2E ' + suffix,
      purpose: 'RENT',
      type: 'HOUSE',
      price: 3500,
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() + 60000),
      address: {
        create: {
          street: 'Rua do Teste',
          number: '43',
          neighborhood: 'Centro',
          city,
          state: 'PR',
          zipCode: '80010000',
        },
      },
    },
  })
  const dual = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      responsibleId: broker.id,
      title: 'Venda e aluguel E2E ' + suffix,
      purpose: 'BOTH',
      type: 'APARTMENT',
      price: 900000,
      rentalPrice: 2500,
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() + 30000),
      address: {
        create: {
          street: 'Rua do Teste',
          number: '44',
          neighborhood: 'Área Rural',
          city,
          state: 'PR',
          zipCode: '80010000',
        },
      },
    },
  })

  return {
    tenantIds: [tenant.id],
    propertyId: property.id,
    propertyTitle,
    rentalPropertyId: rental.id,
    rentalPropertyTitle: rental.title,
    dualPropertyId: dual.id,
    dualPropertyTitle: dual.title,
    city,
    brokerName,
    ownerEmail,
  }
}

export async function cleanupMarketplaceFixtures(prisma: PrismaClient, tenantIds: string[]) {
  isolated()
  await prisma.$transaction([
    prisma.opportunity.deleteMany({
      where: { tenantId: { in: tenantIds }, tenant: { slug: { startsWith: slugPrefix } } },
    }),
    prisma.tenant.deleteMany({
      where: { id: { in: tenantIds }, slug: { startsWith: slugPrefix } },
    }),
  ])
  await prisma.authRateLimitBucket.deleteMany({
    where: { key: { startsWith: 'marketplace-inquiry:' } },
  })
  return null
}

export async function readMarketplaceInquiryEvidence(
  prisma: PrismaClient,
  propertyId: string,
): Promise<MarketplaceInquiryEvidence> {
  isolated()
  const inquiries = await prisma.opportunity.findMany({
    where: { propertyId: propertyId },
    orderBy: { createdAt: 'desc' },
  })
  const latest = inquiries[0]

  return {
    count: inquiries.length,
    status: latest?.status ?? null,
    leadName: latest?.interestedName ?? null,
    leadEmail: latest?.interestedEmail ?? null,
    proposedValue: latest ? latest.proposedValue.toNumber() : null,
    notes: latest?.notes ?? null,
  }
}
