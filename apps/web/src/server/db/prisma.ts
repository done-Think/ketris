import { PrismaClient } from '@prisma/client'

// Singleton do Prisma Client. Em desenvolvimento, o Next.js recarrega módulos a cada mudança
// (Fast Refresh/HMR de rotas de servidor), o que recriaria o client e esgotaria conexões do Postgres se
// não fosse cacheado em `globalThis`. Em produção, cada processo cria sua própria instância normalmente.
// Padrão recomendado pela própria documentação do Prisma para uso com Next.js.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
