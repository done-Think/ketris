import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

import { getDatabaseUrl } from '../src/server/db/database-url'
import { seedContacts, seedOpportunities, seedProperties, seedTenants } from './seed-data'

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
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
})

async function main() {
  const senhaHash = await bcrypt.hash('trocar-em-desenvolvimento', SALT_ROUNDS)

  const tenantIdByEmail = new Map<string, string>()
  const userIdByEmail = new Map<string, string>()
  const tenantIdBySlug = new Map<string, string>()

  for (const seedTenant of seedTenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: seedTenant.slug },
      update: { nome: seedTenant.name },
      create: {
        nome: seedTenant.name,
        slug: seedTenant.slug,
        corPrimaria: seedTenant.corPrimaria,
        corSecundaria: seedTenant.corSecundaria,
      },
    })
    tenantIdBySlug.set(seedTenant.slug, tenant.id)

    for (const member of seedTenant.members) {
      const user = await prisma.usuario.upsert({
        where: { email: member.email },
        update: { tenantId: tenant.id, papel: member.role, avatarUrl: member.avatarUrl },
        create: {
          tenantId: tenant.id,
          nome: member.name,
          email: member.email,
          avatarUrl: member.avatarUrl,
          senhaHash,
          papel: member.role,
        },
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
    const responsavelId = userIdByEmail.get(property.responsavelEmail)
    const tenantId = tenantIdByEmail.get(property.responsavelEmail)

    if (!responsavelId || !tenantId) {
      throw new Error(
        `Imóvel "${property.id}" referencia responsavelEmail "${property.responsavelEmail}" que não existe em seedTenants`,
      )
    }

    await prisma.imovel.upsert({
      where: { id: `seed-imovel-${property.id}` },
      update: {
        tenantId,
        responsavelId,
        status: property.status ?? 'PUBLISHED',
        publicadoEm: property.status === 'DRAFT' ? null : new Date(),
      },
      create: {
        id: `seed-imovel-${property.id}`,
        tenantId,
        responsavelId,
        titulo: property.title,
        descricao: property.description,
        finalidade: property.purpose,
        tipo: property.category,
        quartos: property.bedrooms,
        banheiros: property.bathrooms,
        vagas: property.parking,
        areaM2: property.areaM2,
        valor: property.price,
        status: property.status ?? 'PUBLISHED',
        publicadoEm: property.status === 'DRAFT' ? null : new Date(),
        endereco: {
          create: {
            logradouro: `Rua ${property.neighborhood}`,
            numero: String(100 + index),
            complemento: null,
            bairro: property.neighborhood,
            cidade: property.city,
            estado: 'SP',
            cep: '01000-000',
            latitude: property.latitude,
            longitude: property.longitude,
          },
        },
        midias: {
          create: property.images.map((url, order) => ({ url, tipo: 'foto', ordem: order })),
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
    const record = await prisma.contato.upsert({
      where: { tenantId_email: { tenantId: mainTenantId, email: contact.email } },
      update: {},
      create: {
        id: `seed-contato-${contact.id}`,
        tenantId: mainTenantId,
        nome: contact.name,
        email: contact.email,
        telefone: contact.phone,
        tipo: contact.type,
        avatarUrl: contact.avatarUrl,
        ultimaInteracao: new Date(Date.now() - contact.hoursSinceLastInteraction * 3_600_000),
      },
    })
    contactByLegacyId.set(contact.id, record.id)
  }

  console.log(`Seed concluído — ${seedContacts.length} contatos do crm`)

  for (const opportunity of seedOpportunities) {
    const record = await prisma.oportunidade.upsert({
      where: { id: opportunity.id },
      update: {},
      create: {
        id: opportunity.id,
        tenantId: mainTenantId,
        imovelId: `seed-imovel-${opportunity.propertyId}`,
        contatoId: opportunity.contactId ? contactByLegacyId.get(opportunity.contactId) : null,
        interessadoNome: opportunity.leadName,
        interessadoEmail: opportunity.leadEmail,
        valorProposto: opportunity.proposedValue,
        status: opportunity.status,
        arquivadaEm: opportunity.status === 'RECUSADA' ? new Date() : null,
      },
    })

    await prisma.atividadeOportunidade.upsert({
      where: { id: `${opportunity.id}-criada` },
      update: {},
      create: {
        id: `${opportunity.id}-criada`,
        oportunidadeId: record.id,
        tipo: 'NOTA',
        descricao: 'Oportunidade criada a partir do marketplace.',
      },
    })

    if (opportunity.status !== 'RASCUNHO') {
      await prisma.atividadeOportunidade.upsert({
        where: { id: `${opportunity.id}-status` },
        update: {},
        create: {
          id: `${opportunity.id}-status`,
          oportunidadeId: record.id,
          tipo: 'MUDANCA_STATUS',
          descricao: `Status atualizado para ${opportunity.status}.`,
          statusAnterior: 'RASCUNHO',
          statusNovo: opportunity.status,
        },
      })
    }
  }

  console.log(`Seed concluído — ${seedOpportunities.length} oportunidades do crm`)

  const platformAdminCount = await prisma.platformAdmin.count()

  if (platformAdminCount > 0) {
    console.log('Platform admin já existe — nada a fazer.')
    return
  }

  // `.env.example` traz essas chaves como placeholders vazios (não ausentes) — usar `||` em vez
  // de `??` para que uma string vazia também caia no fallback, não só `undefined`.
  const platformAdminNome = process.env.PLATFORM_ADMIN_NAME || 'Admin Ketris'
  const platformAdminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'platform-admin@ketris.dev'
  const platformAdminPassword = process.env.PLATFORM_ADMIN_PASSWORD || 'trocar-em-desenvolvimento'

  const platformAdminSenhaHash = await bcrypt.hash(platformAdminPassword, SALT_ROUNDS)

  const platformAdmin = await prisma.platformAdmin.create({
    data: { nome: platformAdminNome, email: platformAdminEmail, senhaHash: platformAdminSenhaHash },
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
