import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

import { getDatabaseUrl } from '../src/server/db/database-url'
import { seedContacts, seedOpportunities, seedProperties } from './seed-data'

// Seed mínimo para desenvolvimento local: um tenant + um usuário admin, mais o platform admin.
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
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'ketris-demo' },
    update: {},
    create: {
      nome: 'Ketris Demo',
      slug: 'ketris-demo',
      corPrimaria: '#F30274',
      corSecundaria: '#212631',
    },
  })

  const senhaHash = await bcrypt.hash('trocar-em-desenvolvimento', SALT_ROUNDS)

  await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@ketris.dev' } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Admin Ketris',
      email: 'admin@ketris.dev',
      senhaHash,
      papel: 'ADMIN',
    },
  })

  console.log(`Seed concluído — tenant "${tenant.slug}" com usuário admin@ketris.dev`)

  const brokerByEmail = new Map<string, string>()

  for (const property of seedProperties) {
    if (brokerByEmail.has(property.broker.email)) continue

    const broker = await prisma.usuario.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: property.broker.email } },
      update: {},
      create: {
        tenantId: tenant.id,
        nome: property.broker.name,
        email: property.broker.email,
        senhaHash,
        papel: 'AGENT',
      },
    })
    brokerByEmail.set(property.broker.email, broker.id)
  }

  console.log(`Seed concluído — ${brokerByEmail.size} corretores (usuarios AGENT)`)

  for (const [index, property] of seedProperties.entries()) {
    const responsavelId = brokerByEmail.get(property.broker.email)!

    await prisma.imovel.upsert({
      where: { id: `seed-imovel-${property.id}` },
      update: {},
      create: {
        id: `seed-imovel-${property.id}`,
        tenantId: tenant.id,
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
        status: 'PUBLISHED',
        publicadoEm: new Date(),
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

  console.log(`Seed concluído — ${seedProperties.length} imóveis publicados`)

  const contactByLegacyId = new Map<string, string>()

  for (const contact of seedContacts) {
    const record = await prisma.contato.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: contact.email } },
      update: {},
      create: {
        id: `seed-contato-${contact.id}`,
        tenantId: tenant.id,
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
        tenantId: tenant.id,
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

  const platformAdminNome = process.env.PLATFORM_ADMIN_NAME ?? 'Admin Ketris'
  const platformAdminEmail = process.env.PLATFORM_ADMIN_EMAIL ?? 'platform-admin@ketris.dev'
  const platformAdminPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? 'trocar-em-desenvolvimento'

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
