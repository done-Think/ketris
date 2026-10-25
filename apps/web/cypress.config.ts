import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { defineConfig } from 'cypress'

import { createAuthMailbox } from './cypress/support/auth-mailbox'
import { getDatabaseUrl } from './src/server/db/database-url'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    async setupNodeEvents(on, config) {
      const mailboxPort = Number(process.env.AUTH_E2E_MAILBOX_PORT ?? 0)
      const mailbox = mailboxPort ? createAuthMailbox(mailboxPort) : null
      if (mailbox) {
        const database = new URL(getDatabaseUrl())
        const endpoint = new URL(
          process.env.AWS_ENDPOINT_URL_SES ?? process.env.AWS_ENDPOINT_URL ?? '',
        )
        const app = new URL(config.baseUrl ?? '')
        const localHosts = ['localhost', '127.0.0.1', '[::1]']
        if (
          ![database.hostname, endpoint.hostname, app.hostname].every((host) =>
            localHosts.includes(host),
          )
        )
          throw new Error('O simulador de e-mail E2E exige aplicação, banco e endpoint AWS locais.')
        if (Number(endpoint.port) !== mailboxPort)
          throw new Error('A porta do endpoint AWS deve coincidir com AUTH_E2E_MAILBOX_PORT.')
        await mailbox.start()
      }
      config.env.AUTH_MAILBOX_ENABLED = Boolean(mailbox)
      const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
      })

      on('task', {
        readAuthEmail(email: string) {
          if (!mailbox)
            throw new Error('O simulador de e-mail Auth não foi habilitado para esta execução.')
          return mailbox.read(email)
        },
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
            data: { tenantId: tenant.id, nome: 'Usuário E2E', email, senhaHash, papel: 'OWNER' },
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
          papel: 'OWNER' | 'AGENT'
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
      })

      on('after:run', async () => {
        await prisma.$disconnect()
        if (mailbox) await mailbox.stop()
      })
      return config
    },
  },
})
