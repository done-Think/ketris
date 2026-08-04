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
          await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => null)
          return null
        },
        async seedUserInTenant({
          tenantId,
          email,
          password,
          papel,
        }: {
          tenantId: string
          email: string
          password: string
          papel: 'ADMIN' | 'OWNER' | 'AGENT'
        }) {
          const senhaHash = await bcrypt.hash(password, 10)

          await prisma.usuario.create({
            data: { tenantId, nome: 'Usuário E2E', email, senhaHash, papel },
          })

          return null
        },
        async seedPlatformAdmin({ email, password }: { email: string; password: string }) {
          const senhaHash = await bcrypt.hash(password, 10)

          const admin = await prisma.platformAdmin.create({
            data: { nome: 'Admin Plataforma E2E', email, senhaHash },
          })

          return admin.id
        },
        async cleanupPlatformAdmin(adminId: string) {
          await prisma.platformAdminRefreshToken.deleteMany({
            where: { platformAdminId: adminId },
          })
          await prisma.platformAdmin.delete({ where: { id: adminId } }).catch(() => null)
          return null
        },
        async resetPlatformBootstrap() {
          await prisma.platformAdminRefreshToken.deleteMany()
          await prisma.platformAdmin.deleteMany()
          await prisma.platformSettings.deleteMany()
          return null
        },
      })

      on('after:run', async () => {
        await prisma.$disconnect()
      })
    },
  },
})
