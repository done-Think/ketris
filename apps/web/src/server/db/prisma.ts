import { PrismaClient } from '@prisma/client'

import { getDatabaseUrl } from './database-url'
import { createPostgresAdapter } from './postgres-adapter'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter: createPostgresAdapter({
      connectionString: getDatabaseUrl({ allowPlaceholder: true }),
    }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
