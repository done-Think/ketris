export const placeholderDatabaseUrl = 'postgresql://ketris:ketris@localhost:55432/ketris'

export function getDatabaseUrl(options?: { allowPlaceholder?: boolean }) {
  const databaseUrl =
    process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL

  if (databaseUrl) {
    return databaseUrl
  }

  if (options?.allowPlaceholder) {
    return placeholderDatabaseUrl
  }

  throw new Error('DATABASE_URL não configurado.')
}
