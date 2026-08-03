import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Seed mínimo para desenvolvimento local: um tenant + um usuário admin.
// Rodar com `npm run db:seed -w @ketris/web` (ou `npm run db:seed` dentro de apps/web).

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

  const senhaHash = await bcrypt.hash('trocar-em-desenvolvimento', 10)

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
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
