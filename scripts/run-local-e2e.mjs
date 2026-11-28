import { spawn, spawnSync } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { e2eSpecGlob } from './local-validation-lib.mjs'
import { ciLikeEnv, withTemporaryDatabase } from './run-with-temp-db.mjs'

// Reproduz o job `auth-e2e` do CI na máquina do desenvolvedor: banco descartável, build de
// produção, servidor local e Cypress (Electron). Chamado pelo pre-push quando o diff toca o app.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ports = { app: 3000, mailbox: 3101, storage: 3102 }

// Mesmo bloco `env` do job `auth-e2e`. Credenciais AWS e perfis do .env local são anulados para
// que o E2E só fale com os stubs locais das portas 3101/3102.
const e2eEnv = {
  ...ciLikeEnv,
  NEXT_PUBLIC_APP_URL: `http://localhost:${ports.app}`,
  NEXT_PUBLIC_API_URL: '',
  AUTH_RATE_LIMIT_MAX: '1000',
  FACE_CHECK_DATA_ENCRYPTION_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  FACE_CHECK_S3_BUCKET_NAME: 'face-check-private-e2e',
  FACE_CHECK_RETENTION_SECRET: 'face-check-e2e-retention-secret-32-bytes',
  FACE_CHECK_ENGINE_URL: 'http://127.0.0.1:9',
  FACE_CHECK_ENGINE_TOKEN: 'face-check-e2e-engine-token-32-bytes',
  FACE_CHECK_LOCAL_STORAGE: '',
  API_RATE_LIMIT_MAX: '20000',
  MARKETPLACE_INQUIRY_RATE_LIMIT_MAX: '1000',
  AUTH_E2E_MAILBOX_PORT: String(ports.mailbox),
  CONTRACTS_E2E_STORAGE_PORT: String(ports.storage),
  AWS_ENDPOINT_URL_S3: `http://127.0.0.1:${ports.storage}`,
  S3_BUCKET_NAME: 'contracts-private-e2e',
  KETRIS_E2E_ISOLATED_DB: '1',
  AWS_ENDPOINT_URL: `http://127.0.0.1:${ports.mailbox}`,
  AWS_ENDPOINT_URL_SES: `http://127.0.0.1:${ports.mailbox}`,
  AWS_IGNORE_CONFIGURED_ENDPOINT_URLS: 'false',
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'ci-local-only',
  AWS_SECRET_ACCESS_KEY: 'ci-local-only',
  AWS_SESSION_TOKEN: '',
  AWS_PROFILE: '',
  SES_FROM_EMAIL: 'auth-ci@example.test',
  KETRIS_BUILD_WORKERS: '1',
  KETRIS_BUILD_LOW_MEMORY: '1',
  NEXT_TELEMETRY_DISABLED: '1',
}

function portIsFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)))
  })
}

function step(label, command, args, env) {
  console.error(`\n  • ${label}`)
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${label} falhou.`)
}

async function waitForServer() {
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      const response = await fetch(`http://localhost:${ports.app}/api/auth/csrf`)
      if (response.ok) return
    } catch {
      /* servidor ainda subindo */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error('O servidor de teste não iniciou em 90 segundos.')
}

async function main() {
  for (const [name, port] of Object.entries(ports)) {
    if (!(await portIsFree(port)))
      throw new Error(`A porta ${port} (${name}) está ocupada; encerre o processo e tente de novo.`)
  }
  await withTemporaryDatabase(async (databaseUrl) => {
    const env = { ...process.env, ...e2eEnv, DATABASE_URL: databaseUrl }
    step(
      'Tipos dos testes de navegador',
      'npm',
      ['exec', '--', 'tsc', '--noEmit', '-p', 'apps/web/cypress/tsconfig.json'],
      env,
    )
    step('Build de produção', 'npm', ['run', 'build', '-w', '@ketris/web'], {
      ...env,
      NODE_OPTIONS: '--max-old-space-size=4096',
    })
    const server = spawn(
      'npm',
      ['run', 'start', '-w', '@ketris/web', '--', '--hostname', 'localhost'],
      { cwd: root, env, stdio: 'ignore', detached: true },
    )
    try {
      await waitForServer()
      step(
        'Cypress (Electron)',
        'npm',
        [
          'exec',
          '-w',
          '@ketris/web',
          '--',
          'cypress',
          'run',
          '--browser',
          'electron',
          '--config',
          `baseUrl=http://localhost:${ports.app}`,
          '--spec',
          e2eSpecGlob,
        ],
        env,
      )
    } finally {
      try {
        process.kill(-server.pid)
      } catch {
        /* já encerrado */
      }
    }
  })
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
