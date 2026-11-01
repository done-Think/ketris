import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = new URL(
  process.env.FACE_CHECK_TEST_SERVER_URL ?? 'postgresql://ketris:ketris@127.0.0.1:55532/postgres',
)
if (!['localhost', '127.0.0.1', '[::1]'].includes(server.hostname)) {
  throw new Error('Face Check integration tests only accept a local disposable PostgreSQL server.')
}
const databaseName = `ketris_face_check_test_${randomBytes(6).toString('hex')}`
const connection = new URL(server)
connection.pathname = `/${databaseName}`
const environment = {
  ...process.env,
  DATABASE_URL: connection.href,
  FACE_CHECK_TEST_DATABASE_URL: connection.href,
  FACE_CHECK_DATA_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
  NEXTAUTH_SECRET: 'face-check-test-only',
  AUTH_TOKEN_SECRET: 'face-check-test-only',
  AWS_ACCESS_KEY_ID: 'test-only',
  AWS_SECRET_ACCESS_KEY: 'test-only',
  AWS_REGION: 'us-east-1',
  AWS_ENDPOINT_URL: 'http://127.0.0.1:9',
}
const administrator = new pg.Client({ connectionString: server.href })
await administrator.connect()
function run(command, arguments_, cwd = root) {
  const result = spawnSync(command, arguments_, { cwd, env: environment, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`Face Check verification failed: ${command}`)
}
let created = false
try {
  await administrator.query(`CREATE DATABASE "${databaseName}"`)
  created = true
  run(
    process.execPath,
    [path.join(root, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'],
    path.join(root, 'apps/web'),
  )
  run('npm', [
    'run',
    'test:integration',
    '-w',
    '@ketris/web',
    '--',
    'src/server/face_check/tests',
    '--minWorkers=1',
    '--maxWorkers=1',
  ])
} finally {
  if (created) await administrator.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`)
  await administrator.end()
}
