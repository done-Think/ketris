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
    data: { nome: 'Marketplace E2E', slug: slugPrefix + suffix, accountType: 'AGENCY' },
  })
  const senhaHash = await bcrypt.hash(password, 10)
  const ownerEmail = 'owner-' + suffix + '@marketplace.example.test'
  await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Gestora Marketplace E2E',
      email: ownerEmail,
      senhaHash,
      papel: 'OWNER',
      emailVerificadoEm: new Date(),
    },
  })
  const brokerName = 'Corretora Marketplace ' + suffix
  const broker = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: brokerName,
      email: 'broker-' + suffix + '@marketplace.example.test',
      senhaHash,
      papel: 'AGENT',
      emailVerificadoEm: new Date(),
    },
  })
  await prisma.perfilPublicoCorretor.create({
    data: {
      usuarioId: broker.id,
      displayName: brokerName,
      status: 'PUBLISHED',
      publicadoEm: new Date(),
    },
  })
  const city = 'Cidade E2E ' + suffix
  const propertyTitle = 'Casa Marketplace E2E ' + suffix
  const property = await prisma.imovel.create({
    data: {
      tenantId: tenant.id,
      responsavelId: broker.id,
      titulo: propertyTitle,
      descricao: 'Casa com quintal para o fluxo de proposta E2E.',
      finalidade: 'VENDA',
      tipo: 'CASA',
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      areaM2: 140,
      valor: 650000,
      status: 'PUBLISHED',
      publicadoEm: new Date(Date.now() + 60_000),
      endereco: {
        create: {
          logradouro: 'Rua do Teste',
          numero: '42',
          bairro: 'Centro',
          cidade: city,
          estado: 'PR',
          cep: '80010-000',
        },
      },
    },
  })

  return {
    tenantIds: [tenant.id],
    propertyId: property.id,
    propertyTitle,
    city,
    brokerName,
    ownerEmail,
  }
}

export async function cleanupMarketplaceFixtures(prisma: PrismaClient, tenantIds: string[]) {
  isolated()
  await prisma.$transaction([
    prisma.oportunidade.deleteMany({
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
  const inquiries = await prisma.oportunidade.findMany({
    where: { imovelId: propertyId },
    orderBy: { createdAt: 'desc' },
  })
  const latest = inquiries[0]

  return {
    count: inquiries.length,
    status: latest?.status ?? null,
    leadName: latest?.interessadoNome ?? null,
    leadEmail: latest?.interessadoEmail ?? null,
    proposedValue: latest ? latest.valorProposto.toNumber() : null,
    notes: latest?.observacoes ?? null,
  }
}
