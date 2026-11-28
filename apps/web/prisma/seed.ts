import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { getDatabaseUrl } from '../src/server/db/database-url'
import { createPostgresAdapter } from '../src/server/db/postgres-adapter'
import { RENTER_TENANT_SLUG } from '../src/server/shared/domain/system-tenants'

// Seed mínimo: cria o platform admin do Ketris e o tenant de sistema dos locatários (sem imobiliárias,
// corretores, imóveis ou CRM).
// Rodar com `npm run db:seed` na raiz (ou `npm run db:seed -w @ketris/web`).
//
// O platform admin substitui o antigo endpoint público `POST /api/platform/admins/bootstrap` (ver
// docs/adr/0003-platform-admin-identidade-separada.md, seção Atualização). Credenciais vêm de
// PLATFORM_ADMIN_NAME/_EMAIL/_PASSWORD no .env. Platform admin não tem etapa de confirmação de
// e-mail (o modelo não possui campo de verificação): a conta já nasce ativa e pronta para login.

const SALT_ROUNDS = 10

const prisma = new PrismaClient({
  adapter: createPostgresAdapter({ connectionString: getDatabaseUrl() }),
})

// Tenant de sistema que abriga as contas de locatário (RegisterRenterUseCase o procura pelo slug).
// É dado obrigatório, não demo: sem ele o cadastro de locatário responde 503
// RENTER_TENANT_NOT_CONFIGURED. Idempotente, e roda antes do retorno antecipado do admin para
// também reparar bancos que já têm platform admin.
async function ensureRenterSystemTenant() {
  await prisma.tenant.upsert({
    where: { slug: RENTER_TENANT_SLUG },
    update: {},
    create: { slug: RENTER_TENANT_SLUG, name: 'Locatários Ketris' },
  })
  console.log(`Tenant de sistema "${RENTER_TENANT_SLUG}" garantido.`)
}

async function main() {
  await ensureRenterSystemTenant()

  const platformAdminCount = await prisma.platformAdmin.count()

  if (platformAdminCount > 0) {
    console.log('Platform admin já existe — nada a fazer.')
    return
  }

  // Chaves vazias no .env chegam como string vazia (não undefined) — `||` cobre os dois casos.
  const name = process.env.PLATFORM_ADMIN_NAME || 'Admin Ketris'
  const email = process.env.PLATFORM_ADMIN_EMAIL || 'admin@ketris.local'
  const password = process.env.PLATFORM_ADMIN_PASSWORD

  if (!password) {
    throw new Error('Defina PLATFORM_ADMIN_PASSWORD no .env antes de rodar o seed.')
  }

  const platformAdmin = await prisma.platformAdmin.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      active: true,
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
