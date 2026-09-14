import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const placeholderDatabaseUrl = 'postgresql://ketris:ketris@localhost:55432/ketris'
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  placeholderDatabaseUrl

if (
  !process.env.DATABASE_URL &&
  !process.env.POSTGRES_PRISMA_URL &&
  !process.env.POSTGRES_URL &&
  requiresDatabaseConnection(process.argv)
) {
  throw new Error('DATABASE_URL não configurado.')
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
})

function requiresDatabaseConnection(argv: string[]) {
  return argv.some((arg) => arg === 'migrate' || arg === 'db' || arg === 'studio')
}
