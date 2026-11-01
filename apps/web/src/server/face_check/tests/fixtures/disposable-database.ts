import { PrismaClient } from '@prisma/client'
import { createPostgresAdapter } from '@server/db/postgres-adapter'

export function disposableFaceCheckDatabase() {
  // Never fall back to DATABASE_URL or dotenv. The caller must provision and migrate a
  // disposable database, then explicitly opt these tests into that separate connection.
  const connectionString = process.env.FACE_CHECK_TEST_DATABASE_URL
  if (!connectionString) throw new Error('FACE_CHECK_TEST_DATABASE_URL is required.')
  const url = new URL(connectionString)
  const database = decodeURIComponent(url.pathname.slice(1))
  if (!/^ketris_face_check_test_[a-z0-9_]+$/.test(database))
    throw new Error(
      'Face check integration tests require a disposable ketris_face_check_test_* database.',
    )
  return new PrismaClient({ adapter: createPostgresAdapter({ connectionString, max: 1 }) })
}
