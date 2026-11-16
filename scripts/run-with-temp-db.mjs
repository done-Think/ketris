import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

// Cria um banco PostgreSQL descartável no servidor local (docker compose), aplica as migrations,
// roda um comando contra ele e apaga tudo no final. Os testes do pre-push nunca tocam o banco de
// desenvolvimento. Uso: node scripts/run-with-temp-db.mjs -- <comando> [args...]

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultServer = 'postgresql://ketris:ketris@127.0.0.1:55532/postgres'

// Mesmos valores do job `quality` do CI: segredos fixos e inofensivos só para testes.
export const ciLikeEnv = {
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'ci-nextauth-secret',
  AUTH_TOKEN_SECRET: 'ci-auth-token-secret',
  PLATFORM_TOKEN_SECRET: 'ci-platform-token-secret',
  PASSWORD_RESET_TOKEN_SECRET: 'ci-password-reset-token-secret',
  CONTRACTS_DATA_ENCRYPTION_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
}

export function localServerUrl(env = process.env) {
  const url = new URL(env.LOCAL_PG_SERVER_URL ?? defaultServer)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new Error('A validação local só aceita um PostgreSQL local descartável.')
  return url
}

export async function withTemporaryDatabase(callback, { env = process.env } = {}) {
  const server = localServerUrl(env)
  const name = `ketris_prepush_${randomBytes(6).toString('hex')}`
  const connection = new URL(server)
  connection.pathname = `/${name}`
  const administrator = new pg.Client({ connectionString: server.href })
  try {
    await administrator.connect()
  } catch {
    throw new Error(
      `PostgreSQL local indisponível em ${server.host}. Suba o banco com: docker compose up -d`,
    )
  }
  let created = false
  try {
    await administrator.query(`CREATE DATABASE "${name}"`)
    created = true
    const migrate = spawnSync(
      process.execPath,
      [path.join(root, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'],
      {
        cwd: path.join(root, 'apps/web'),
        env: { ...env, ...ciLikeEnv, DATABASE_URL: connection.href },
        stdio: 'inherit',
      },
    )
    if (migrate.status !== 0)
      throw new Error('Falha ao aplicar as migrations no banco descartável.')
    return await callback(connection.href)
  } finally {
    if (created) await administrator.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await administrator.end()
  }
}

async function main() {
  const separator = process.argv.indexOf('--')
  const [command, ...args] = process.argv.slice(separator + 1)
  if (separator === -1 || !command) throw new Error('Uso: run-with-temp-db.mjs -- <comando> [args]')
  process.exitCode = await withTemporaryDatabase((databaseUrl) => {
    const result = spawnSync(command, args, {
      cwd: root,
      env: { ...process.env, ...ciLikeEnv, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    })
    return result.status ?? 1
  })
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
