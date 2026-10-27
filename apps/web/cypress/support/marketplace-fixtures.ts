import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getDatabaseUrl } from '../../src/server/db/database-url'
import type {
  MarketplaceFixtureInput,
  MarketplaceFixtureResult,
  MarketplaceInquiryEvidence,
} from '../types/marketplace-fixtures'

function assertLocalDatabase() {
  const url = new URL(getDatabaseUrl())
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    process.env.KETRIS_E2E_ISOLATED_DB !== '1'
  )
    throw new Error('Fixtures de marketplace exigem banco local isolado.')
}
async function assertFixtureTenant(prisma: PrismaClient, id: string) {
  assertLocalDatabase()
  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { slug: true } })
  if (!tenant?.slug.startsWith('marketplace-e2e-'))
    throw new Error('Tenant não pertence às fixtures de marketplace.')
}
export async function seedMarketplaceFixtures(
  prisma: PrismaClient,
  { suffix, password }: MarketplaceFixtureInput,
): Promise<MarketplaceFixtureResult> {
  assertLocalDatabase()
  if (!/^[a-z0-9-]+$/.test(suffix)) throw new Error('Identificador de fixture inválido.')
  const tenant = await prisma.tenant.create({
    data: { nome: 'Marketplace E2E', slug: 'marketplace-e2e-' + suffix },
  })
  const senhaHash = await bcrypt.hash(password, 10)
  const owner = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Gestora Marketplace E2E',
      email: 'owner-' + suffix + '@marketplace.example.test',
      senhaHash,
      papel: 'OWNER',
      emailVerificadoEm: new Date(),
    },
  })
  const propertyTitle = 'Apartamento E2E ' + suffix
  const property = await prisma.imovel.create({
    data: {
      tenantId: tenant.id,
      responsavelId: owner.id,
      titulo: propertyTitle,
      finalidade: 'ALUGUEL',
      tipo: 'APARTAMENTO',
      valor: 2800,
      quartos: 2,
      status: 'PUBLISHED',
      publicadoEm: new Date(),
      endereco: {
        create: {
          logradouro: 'Rua E2E',
          numero: '10',
          bairro: 'Centro',
          cidade: 'Curitiba',
          estado: 'PR',
          cep: '80000-000',
        },
      },
    },
  })
  return { tenantId: tenant.id, ownerEmail: owner.email, propertyId: property.id, propertyTitle }
}
export async function readMarketplaceInquiries(
  prisma: PrismaClient,
  { tenantId, propertyId }: { tenantId: string; propertyId: string },
): Promise<MarketplaceInquiryEvidence[]> {
  await assertFixtureTenant(prisma, tenantId)
  const opportunities = await prisma.oportunidade.findMany({ where: { imovelId: propertyId } })
  return opportunities.map((item) => ({
    id: item.id,
    tenantId: item.tenantId,
    leadName: item.interessadoNome,
    leadEmail: item.interessadoEmail,
    proposedValue: Number(item.valorProposto),
    status: item.status,
  }))
}
export async function cleanupMarketplaceFixtures(
  prisma: PrismaClient,
  tenantIds: string[],
): Promise<null> {
  for (const tenantId of tenantIds) {
    await assertFixtureTenant(prisma, tenantId)
    await prisma.oportunidade.deleteMany({ where: { tenantId } })
    await prisma.imovel.deleteMany({ where: { tenantId } })
    await prisma.tenant.delete({ where: { id: tenantId } })
  }
  return null
}
