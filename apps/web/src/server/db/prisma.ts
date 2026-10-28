import { PrismaClient } from '@prisma/client'

import { getDatabaseUrl } from './database-url'
import { createPostgresAdapter } from './postgres-adapter'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createPostgresAdapter({
      connectionString: getDatabaseUrl({ allowPlaceholder: true }),
    }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
