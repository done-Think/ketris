import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { getDatabaseUrl } from '../src/server/db/database-url'
import { createPostgresAdapter } from '../src/server/db/postgres-adapter'
import { protectLegacyContractCpfs } from '../src/server/contracts/infrastructure/protect-legacy-contract-cpfs'
import { seedContacts, seedOpportunities, seedProperties, seedTenants } from './seed-data'
import { seedPublicProfiles } from './seed-public-profiles'

// Seed de desenvolvimento local: várias imobiliárias, corretores autônomos, proprietários
// independentes, construtoras e locatários, além do platform admin — dataset suficiente para
// testar papéis, permissões de acesso e vínculos entre tenants sem depender de dados criados
// manualmente ou deixados por testes de integração.
// Rodar com `npm run db:seed -w @ketris/web` (ou `npm run db:seed` dentro de apps/web).
//
// O platform admin substitui o antigo endpoint público `POST /api/platform/admins/bootstrap` (ver
// docs/adr/0003-platform-admin-identidade-separada.md, seção Atualização): o Ketris roda como uma
// instância única operada pela própria equipe, então não há necessidade de uma rota HTTP anônima só
// para o "dia zero" — rodar este script uma vez no deploy resolve o mesmo problema, com menos
// superfície de ataque e menos código. Em produção, defina PLATFORM_ADMIN_NAME/_EMAIL/_PASSWORD no
// ambiente antes de rodar `npm run db:seed`; em dev, os valores abaixo servem de fallback.

const SALT_ROUNDS = 10

const prisma = new PrismaClient({
  adapter: createPostgresAdapter({ connectionString: getDatabaseUrl() }),
})

async function main() {
  const protectedCount = await protectLegacyContractCpfs(prisma)
  console.log(`Proteção de CPFs concluída: ${protectedCount} registros atualizados.`)
  const passwordHash = await bcrypt.hash('trocar-em-desenvolvimento', SALT_ROUNDS)

  const tenantIdByEmail = new Map<string, string>()
  const userIdByEmail = new Map<string, string>()
  const tenantIdBySlug = new Map<string, string>()

  for (const seedTenant of seedTenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: seedTenant.slug },
      update: { name: seedTenant.name, accountType: seedTenant.accountType },
      create: {
        name: seedTenant.name,
        slug: seedTenant.slug,
        accountType: seedTenant.accountType,
        primaryColor: seedTenant.primaryColor,
        secondaryColor: seedTenant.secondaryColor,
      },
    })
    tenantIdBySlug.set(seedTenant.slug, tenant.id)

    for (const member of seedTenant.members) {
      const user = await prisma.$transaction(async (tx) => {
        const previous = await tx.user.findUnique({
          where: { tenantId_email: { tenantId: tenant.id, email: member.email } },
          select: { id: true },
        })
        const saved = await tx.user.upsert({
          where: { tenantId_email: { tenantId: tenant.id, email: member.email } },
          update: {
            tenantId: tenant.id,
            name: member.name,
            role: member.role,
            avatarUrl: member.avatarUrl,
            passwordHash,
            active: true,
            membershipApprovedAt: new Date(),
          },
          create: {
            tenantId: tenant.id,
            name: member.name,
            email: member.email,
            avatarUrl: member.avatarUrl,
            passwordHash,
            role: member.role,
          },
        })
        await tx.userAuditEvent.create({
          data: {
            userId: saved.id,
            tenantId: tenant.id,
            action: previous ? 'UPDATED' : 'CREATED',
            actorType: 'SYSTEM',
            changedFields: previous
              ? ['name', 'role', 'avatarUrl', 'password', 'active', 'pendingApproval']
              : [],
          },
        })
        return saved
      })
      tenantIdByEmail.set(member.email, tenant.id)
      userIdByEmail.set(member.email, user.id)
    }
  }

  const totalMembers = seedTenants.reduce((sum, t) => sum + t.members.length, 0)
  console.log(
    `Seed concluído — ${seedTenants.length} tenants e ${totalMembers} usuários (imobiliárias, corretores autônomos, proprietários, construtoras e locatários)`,
  )

  for (const [index, property] of seedProperties.entries()) {
    const responsibleId = userIdByEmail.get(property.responsibleEmail)
    const tenantId = tenantIdByEmail.get(property.responsibleEmail)

    if (!responsibleId || !tenantId) {
      throw new Error(
        `Imóvel "${property.id}" referencia responsavelEmail "${property.responsibleEmail}" que não existe em seedTenants`,
      )
    }

    const ownerId = property.ownerEmail ? (userIdByEmail.get(property.ownerEmail) ?? null) : null

    await prisma.property.upsert({
      where: { id: `seed-imovel-${property.id}` },
      update: {
        tenantId,
        responsibleId,
        ownerId,
        status: property.status ?? 'PUBLISHED',
        publishedAt: property.status === 'DRAFT' ? null : new Date(),
      },
      create: {
        id: `seed-imovel-${property.id}`,
        tenantId,
        responsibleId,
        ownerId,
        title: property.title,
        description: property.description,
        purpose: property.purpose,
        type: property.category,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpots: property.parking,
        areaSqm: property.areaSqm,
        price: property.price,
        status: property.status ?? 'PUBLISHED',
        publishedAt: property.status === 'DRAFT' ? null : new Date(),
        address: {
          create: {
            street: `Rua ${property.neighborhood}`,
            number: String(100 + index),
            complement: null,
            neighborhood: property.neighborhood,
            city: property.city,
            state: 'SP',
            zipCode: '01000-000',
            latitude: property.latitude,
            longitude: property.longitude,
          },
        },
        media: {
          create: property.images.map((url, order) => ({ url, type: 'PHOTO', position: order })),
        },
      },
    })
  }

  console.log(`Seed concluído — ${seedProperties.length} imóveis`)

  const mainTenantId = tenantIdBySlug.get('ketris-demo')

  if (!mainTenantId) {
    throw new Error('Tenant "ketris-demo" (Imobiliária Horizonte) não encontrado em seedTenants')
  }

  const contactByLegacyId = new Map<string, string>()

  for (const contact of seedContacts) {
    const record = await prisma.contact.upsert({
      where: { tenantId_email: { tenantId: mainTenantId, email: contact.email } },
      update: {},
      create: {
        id: `seed-contato-${contact.id}`,
        tenantId: mainTenantId,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        type: contact.type,
        avatarUrl: contact.avatarUrl,
        lastInteraction: new Date(Date.now() - contact.hoursSinceLastInteraction * 3_600_000),
      },
    })
    contactByLegacyId.set(contact.id, record.id)
  }

  console.log(`Seed concluído — ${seedContacts.length} contatos do crm`)

  for (const opportunity of seedOpportunities) {
    const property = await prisma.property.findUniqueOrThrow({
      where: { id: `seed-imovel-${opportunity.propertyId}` },
      select: { responsibleId: true },
    })
    const record = await prisma.opportunity.upsert({
      where: { id: opportunity.id },
      update: {},
      create: {
        id: opportunity.id,
        tenantId: mainTenantId,
        propertyId: `seed-imovel-${opportunity.propertyId}`,
        responsibleId: property.responsibleId,
        contactId: opportunity.contactId ? contactByLegacyId.get(opportunity.contactId) : null,
        interestedName: opportunity.leadName,
        interestedEmail: opportunity.leadEmail,
        proposedValue: opportunity.proposedValue,
        status: opportunity.status,
        archivedAt: opportunity.status === 'REJECTED' ? new Date() : null,
      },
    })

    await prisma.opportunityActivity.upsert({
      where: { id: `${opportunity.id}-criada` },
      update: {},
      create: {
        id: `${opportunity.id}-criada`,
        opportunityId: record.id,
        type: 'NOTE',
        description: 'Oportunidade criada a partir do marketplace.',
      },
    })

    if (opportunity.status !== 'DRAFT') {
      await prisma.opportunityActivity.upsert({
        where: { id: `${opportunity.id}-status` },
        update: {},
        create: {
          id: `${opportunity.id}-status`,
          opportunityId: record.id,
          type: 'STATUS_CHANGE',
          description: `Status atualizado para ${opportunity.status}.`,
          previousStatus: 'DRAFT',
          newStatus: opportunity.status,
        },
      })
    }
  }

  console.log(`Seed concluído — ${seedOpportunities.length} oportunidades do crm`)

  const publicProfiles = await seedPublicProfiles(prisma)
  console.log(
    `Seed concluído — ${publicProfiles.brokers} perfis de corretores e ${publicProfiles.agencies} perfis de imobiliárias, preservando perfis existentes`,
  )

  const platformAdminCount = await prisma.platformAdmin.count()

  if (platformAdminCount > 0) {
    console.log('Platform admin já existe — nada a fazer.')
    return
  }

  // `.env.example` traz essas chaves como placeholders vazios (não ausentes) — usar `||` em vez
  // de `??` para que uma string vazia também caia no fallback, não só `undefined`.
  const platformAdminName = process.env.PLATFORM_ADMIN_NAME || 'Admin Ketris'
  const platformAdminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'platform-admin@ketris.dev'
  const platformAdminPassword = process.env.PLATFORM_ADMIN_PASSWORD || 'trocar-em-desenvolvimento'

  const platformAdminPasswordHash = await bcrypt.hash(platformAdminPassword, SALT_ROUNDS)

  const platformAdmin = await prisma.platformAdmin.create({
    data: {
      name: platformAdminName,
      email: platformAdminEmail,
      passwordHash: platformAdminPasswordHash,
    },
  })

  console.log(`Platform admin criado: ${platformAdmin.email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
