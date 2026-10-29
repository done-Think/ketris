import {
  seedMaintenanceFixtures,
  cleanupMaintenanceFixtures,
  readMaintenanceEvidence,
} from './cypress/support/maintenance-fixtures'
import type { MaintenanceFixtureInput } from './cypress/types/maintenance-fixtures'
import {
  seedFinancialFixtures,
  cleanupFinancialFixtures,
  readFinancialEvidence,
} from './cypress/support/financial-fixtures'
import type { FinancialFixtureInput } from './cypress/types/financial-fixtures'
import {
  seedMarketplaceFixtures,
  cleanupMarketplaceFixtures,
  readMarketplaceInquiryEvidence,
} from './cypress/support/marketplace-fixtures'
import type { MarketplaceFixtureInput } from './cypress/types/marketplace-fixtures'
import {
  seedCrmFixtures,
  cleanupCrmFixtures,
  readCrmEvidence,
} from './cypress/support/crm-fixtures'
import type { CrmFixtureInput } from './cypress/types/crm-fixtures'
import {
  seedContractFixtures,
  cleanupContractFixtures,
  readContractEvidence,
} from './cypress/support/contracts-fixtures'
import type { ContractFixtureSeedInput } from './cypress/types/contracts-fixtures'
import { startPrivateS3Server } from './src/server/shared/tests/fixtures/private-s3-server'
import {
  seedAgendaFixtures,
  cleanupAgendaFixtures,
  readAgendaAudit,
} from './cypress/support/agenda-fixtures'
import type { AgendaFixtureSeedInput } from './cypress/types/agenda-fixtures'
import {
  seedTeamFixtures,
  cleanupTeamFixtures,
  readTeamEvidence,
} from './cypress/support/team-fixtures'
import type { TeamFixtureInput } from './cypress/types/team-fixtures'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { defineConfig } from 'cypress'

import { createAuthMailbox } from './cypress/support/auth-mailbox'
import { getDatabaseUrl } from './src/server/db/database-url'
import { createPostgresAdapter } from './src/server/db/postgres-adapter'

export default defineConfig({
  allowCypressEnv: false,
  expose: {
    DATABASE_AVAILABLE: false,
    AUTH_MAILBOX_ENABLED: false,
    CONTRACTS_STORAGE_ENABLED: false,
  },
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
      const storagePort = Number(process.env.CONTRACTS_E2E_STORAGE_PORT ?? 0)
      let contractStorage: Awaited<ReturnType<typeof startPrivateS3Server>> | null = null
      if (storagePort) {
        const database = new URL(getDatabaseUrl())
        const endpoint = new URL(process.env.AWS_ENDPOINT_URL_S3 ?? '')
        const app = new URL(config.baseUrl ?? '')
        const localHosts = ['localhost', '127.0.0.1', '[::1]']
        if (
          process.env.KETRIS_E2E_ISOLATED_DB !== '1' ||
          ![database.hostname, endpoint.hostname, app.hostname].every((host) =>
            localHosts.includes(host),
          ) ||
          Number(endpoint.port) !== storagePort
        )
          throw new Error('O simulador de PDFs exige aplicação, banco isolado e storage locais.')
        contractStorage = await startPrivateS3Server(storagePort, app.origin)
      }
      // Only public fixture flags belong in the browser; keep other env values in Node.
      config.expose.DATABASE_AVAILABLE =
        config.env.DATABASE_AVAILABLE ?? config.expose.DATABASE_AVAILABLE
      config.expose.CONTRACTS_STORAGE_ENABLED = Boolean(contractStorage)
      config.expose.AUTH_MAILBOX_ENABLED = Boolean(mailbox)
      const prisma = new PrismaClient({
        adapter: createPostgresAdapter({ connectionString: getDatabaseUrl() }),
      })

      on('task', {
        seedMaintenanceFixtures: (input: MaintenanceFixtureInput) =>
          seedMaintenanceFixtures(prisma, input),
        cleanupMaintenanceFixtures: (tenantIds: string[]) =>
          cleanupMaintenanceFixtures(prisma, tenantIds),
        readMaintenanceEvidence: (id: string) => readMaintenanceEvidence(prisma, id),
        seedFinancialFixtures: (input: FinancialFixtureInput) =>
          seedFinancialFixtures(prisma, input),
        cleanupFinancialFixtures: (tenantIds: string[]) =>
          cleanupFinancialFixtures(prisma, tenantIds),
        readFinancialEvidence: (chargeId: string) => readFinancialEvidence(prisma, chargeId),
        seedMarketplaceFixtures: (input: MarketplaceFixtureInput) =>
          seedMarketplaceFixtures(prisma, input),
        cleanupMarketplaceFixtures: (tenantIds: string[]) =>
          cleanupMarketplaceFixtures(prisma, tenantIds),
        readMarketplaceInquiryEvidence: (propertyId: string) =>
          readMarketplaceInquiryEvidence(prisma, propertyId),
        seedCrmFixtures: (input: CrmFixtureInput) => seedCrmFixtures(prisma, input),
        cleanupCrmFixtures: (tenantIds: string[]) => cleanupCrmFixtures(prisma, tenantIds),
        readCrmEvidence: (input: { tenantId: string; contactId: string }) =>
          readCrmEvidence(prisma, input),
        seedContractFixtures: (input: ContractFixtureSeedInput) =>
          seedContractFixtures(prisma, input),
        cleanupContractFixtures: (tenantIds: string[]) =>
          cleanupContractFixtures(prisma, tenantIds),
        readContractEvidence: (contractId: string) => readContractEvidence(prisma, contractId),
        seedAgendaFixtures: (input: AgendaFixtureSeedInput) => seedAgendaFixtures(prisma, input),
        cleanupAgendaFixtures: (tenantIds: string[]) => cleanupAgendaFixtures(prisma, tenantIds),
        readAgendaAudit: (eventId: string) => readAgendaAudit(prisma, eventId),
        seedTeamFixtures: (input: TeamFixtureInput) => seedTeamFixtures(prisma, input),
        cleanupTeamFixtures: (tenantIds: string[]) => cleanupTeamFixtures(prisma, tenantIds),
        readTeamEvidence: (input: Parameters<typeof readTeamEvidence>[1]) =>
          readTeamEvidence(prisma, input),
        readTeamInvitationEmail(email: string) {
          if (!mailbox)
            throw new Error('O simulador de e-mail Auth não foi habilitado para esta execução.')
          return mailbox.readInvitation(email)
        },
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
            data: { name: 'Tenant E2E', slug: tenantSlug },
          })
          const passwordHash = await bcrypt.hash(password, 10)

          await prisma.user.create({
            data: { tenantId: tenant.id, name: 'Usuário E2E', email, passwordHash, role: 'OWNER' },
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
          role,
        }: {
          tenantId: string
          email: string
          password: string
          role: 'OWNER' | 'AGENT'
        }) {
          const passwordHash = await bcrypt.hash(password, 10)

          await prisma.user.create({
            data: { tenantId, name: 'Usuário E2E', email, passwordHash, role },
          })

          return null
        },
        async seedPlatformAdmin({
          email,
          password,
          role = 'ADMIN',
        }: {
          email: string
          password: string
          role?: 'ADMIN' | 'ADMIN_AGENT' | 'AGENT'
        }) {
          const passwordHash = await bcrypt.hash(password, 10)

          const admin = await prisma.platformAdmin.create({
            data: { name: 'Admin Plataforma E2E', email, passwordHash, role },
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
        async cleanupPlatformAdminsByEmail(emails: string[]) {
          await prisma.platformAdminRefreshToken.deleteMany({
            where: { platformAdmin: { email: { in: emails } } },
          })
          await prisma.platformAdmin.deleteMany({ where: { email: { in: emails } } })
          return null
        },
        async cleanupTenantsBySlug(slugs: string[]) {
          await prisma.tenant.deleteMany({ where: { slug: { in: slugs } } })
          return null
        },
      })

      on('after:run', async () => {
        await prisma.$disconnect()
        if (mailbox) await mailbox.stop()
        if (contractStorage) await contractStorage.close()
      })
      return config
    },
  },
})
