import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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

const prisma = new PrismaClient()

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
