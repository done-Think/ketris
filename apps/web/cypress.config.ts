import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    setupNodeEvents(on) {
      // Tasks Prisma p/ seed e cleanup de dados de teste — rodam no processo Node do Cypress, fora do
      // Next.js, direto contra o mesmo Postgres (DATABASE_URL). Usadas pelos specs que precisam de um
      // usuário real no banco (ex.: cypress/e2e/auth/login.cy.ts) — ver ADR-0002 / constitution.md III.
      const prisma = new PrismaClient()

      on('task', {
        async seedAuthUser({
          email,
          password,
          tenantSlug,
        }: {
          email: string
          password: string
          tenantSlug: string
        }) {
          const tenant = await prisma.tenant.create({
            data: { nome: 'Tenant E2E', slug: tenantSlug },
          })
          const senhaHash = await bcrypt.hash(password, 10)

          await prisma.usuario.create({
            data: { tenantId: tenant.id, nome: 'Usuário E2E', email, senhaHash, papel: 'ADMIN' },
          })

          return tenant.id
        },
        async cleanupAuthUser(tenantId: string) {
          // onDelete: Cascade no schema apaga o usuário junto — ignora erro se já não existir.
          await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => null)
          return null
        },
      })

      on('after:run', async () => {
        await prisma.$disconnect()
      })
    },
  },
})
