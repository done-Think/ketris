import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { getDatabaseUrl } from '../src/server/db/database-url'
import { createPostgresAdapter } from '../src/server/db/postgres-adapter'

// Seed mínimo: cria apenas o platform admin do Ketris (sem imobiliárias, corretores, imóveis ou CRM).
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

async function main() {
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
