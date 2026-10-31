import { spawn } from 'node:child_process'
import { readFile, readdir, mkdir, writeFile, appendFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { ensureSmokeAccount } from './staging-smoke-account.mjs'
import {
  createSmokeCredentials,
  createReleaseDatabase,
  findAutomationBypass,
  geocodingDeploymentArgs,
  planMigrations,
  requireValue,
  requiresAutomationBypass,
  runRelease,
  smokeDeployment,
  smokePublicDeployment,
  validateCandidate,
  validateConfig,
} from './staging-release-lib.mjs'

const env = process.env

export function command(binary, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      cwd: options.cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let timedOut = false
    let forceKill
    const timeout = setTimeout(
      () => {
        timedOut = true
        child.kill('SIGTERM')
        forceKill = setTimeout(() => child.kill('SIGKILL'), 5_000)
      },
      options.timeoutMs ?? 20 * 60_000,
    )
    function cleanup() {
      clearTimeout(timeout)
      clearTimeout(forceKill)
    }
    child.stdout.on('data', (data) => {
      stdout = (stdout + data).slice(-1_000_000)
    })
    // CLI/Prisma diagnostics can contain secrets. Provider logs remain in their own console.
    child.stderr.on('data', () => {})
    child.on('error', () => {
      cleanup()
      reject(new Error('COMMAND_UNAVAILABLE'))
    })
    child.on('close', (code) => {
      cleanup()
      if (timedOut) reject(new Error('COMMAND_TIMEOUT'))
      else if (code === 0) resolve(stdout.trim())
      else reject(new Error('COMMAND_FAILED'))
    })
  })
}

export async function main() {
  const target = JSON.parse(await readFile('infra/deploy/staging.json', 'utf8'))
  const databaseUrl = validateConfig(env, target)
  const geocodingArgs = geocodingDeploymentArgs(env, target)
  const smokeCredentials = createSmokeCredentials()
  const { Client } = createRequire(import.meta.url)('pg')
  const ca = await fetch('https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem', {
    signal: AbortSignal.timeout(15_000),
  })
  requireValue(ca.ok, 'RDS_CA_UNAVAILABLE')
  const withDatabase = createReleaseDatabase(Client, {
    host: databaseUrl.hostname,
    port: 5432,
    database: target.databaseName,
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    ssl: { ca: await ca.text(), rejectUnauthorized: true },
    application_name: 'ketris-staging-release',
  })
  const files = await Promise.all(
    (await readdir('apps/web/prisma/migrations', { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => ({
        name: entry.name,
        sql: await readFile(`apps/web/prisma/migrations/${entry.name}/migration.sql`),
      })),
  )
  files.sort((a, b) => a.name.localeCompare(b.name))
  async function ledger(client) {
    const exists = await client.query("SELECT to_regclass('public._prisma_migrations') AS name")
    if (!exists.rows[0].name) return []
    return (
      await client.query(
        'SELECT migration_name, checksum, finished_at, rolled_back_at FROM public._prisma_migrations',
      )
    ).rows
  }
  async function providerRequest(path, options = {}) {
    const url = new URL(path, 'https://api.vercel.com')
    url.searchParams.set('teamId', env.VERCEL_ORG_ID)
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: options.body,
      signal: AbortSignal.timeout(20_000),
    })
    requireValue(response.ok, `VERCEL_CONFIGURATION_FAILED_${response.status}`)
    return response.json()
  }
  const cliAuth = ['--token', env.VERCEL_TOKEN, '--scope', env.VERCEL_ORG_ID]
  let userId
  let bypass
  const result = await runRelease({
    async preflight() {
      const project = await providerRequest(
        `/v9/projects/${encodeURIComponent(env.VERCEL_PROJECT_ID)}`,
      )
      requireValue(
        project.id === env.VERCEL_PROJECT_ID &&
          project.name === target.projectName &&
          project.accountId === env.VERCEL_ORG_ID &&
          project.rootDirectory === 'apps/web',
        'WRONG_VERCEL_PROJECT',
      )
      const domains = await providerRequest(
        `/v9/projects/${encodeURIComponent(env.VERCEL_PROJECT_ID)}/domains`,
      )
      requireValue(
        domains.domains?.some((domain) => domain.name === new URL(target.origin).hostname),
        'WRONG_STAGING_DOMAIN',
      )
      bypass = findAutomationBypass(project, env.VERCEL_AUTOMATION_BYPASS_SECRET)
      if (!bypass && requiresAutomationBypass(project)) {
        const protection = await providerRequest(
          `/v1/projects/${encodeURIComponent(env.VERCEL_PROJECT_ID)}/protection-bypass`,
          { method: 'PATCH', body: '{}' },
        )
        bypass = findAutomationBypass(protection)
        requireValue(bypass, 'AUTOMATION_BYPASS_UNAVAILABLE')
      }
      console.log('Staging target and credentials checked.')
    },
    async plan() {
      console.log('Checking database migration history.')
      const pending = await withDatabase(async (client) =>
        planMigrations(files, await ledger(client), target.compatibleMigrations),
      )
      console.log(`Pending migrations: ${pending.length}`)
      return pending
    },
    async prepare() {
      await mkdir('.vercel', { recursive: true })
      await writeFile(
        '.vercel/project.json',
        JSON.stringify({
          projectId: env.VERCEL_PROJECT_ID,
          orgId: env.VERCEL_ORG_ID,
        }),
        { mode: 0o600 },
      )
      const output = await command('vercel', [
        'deploy',
        '--prod',
        '--skip-domain',
        '--yes',
        '--meta',
        `githubCommitSha=${env.GITHUB_SHA}`,
        '--meta',
        'githubCommitRef=dev',
        '--env',
        `KETRIS_RELEASE_SHA=${env.GITHUB_SHA}`,
        '--build-env',
        `KETRIS_RELEASE_SHA=${env.GITHUB_SHA}`,
        ...cliAuth,
        ...geocodingArgs,
      ])
      const candidate = validateCandidate(output, target.projectName)
      const deployment = await providerRequest(
        `/v13/deployments/${encodeURIComponent(new URL(candidate).hostname)}`,
      )
      requireValue(
        deployment.projectId === env.VERCEL_PROJECT_ID &&
          deployment.target === 'production' &&
          deployment.readyState === 'READY' &&
          deployment.meta?.githubCommitSha === env.GITHUB_SHA,
        'WRONG_CANDIDATE_DEPLOYMENT',
      )
      console.log(`Candidate ready: ${candidate}`)
      return candidate
    },
    async checkCurrentHead() {
      const response = await fetch(
        'https://api.github.com/repos/done-Think/ketris/git/ref/heads/dev',
        {
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
          signal: AbortSignal.timeout(15_000),
        },
      )
      requireValue(
        response.ok && (await response.json()).object?.sha === env.GITHUB_SHA,
        'RELEASE_SUPERSEDED',
      )
    },
    async migrate() {
      console.log('Applying pending migrations with Prisma.')
      await command(
        process.execPath,
        ['../../node_modules/prisma/build/index.js', 'migrate', 'deploy'],
        { cwd: 'apps/web', timeoutMs: 5 * 60_000 },
      )
      console.log('Pending migrations applied.')
    },
    async verifyDatabase() {
      console.log('Checking migration history after candidate build.')
      await withDatabase(async (client) => {
        requireValue(
          planMigrations(files, await ledger(client), target.compatibleMigrations).length === 0,
          'MIGRATIONS_STILL_PENDING',
        )
      })
      console.log('Checking database schema with Prisma.')
      await command(
        process.execPath,
        [
          '../../node_modules/prisma/build/index.js',
          'migrate',
          'diff',
          '--from-config-datasource',
          '--to-schema',
          'prisma/schema.prisma',
          '--exit-code',
        ],
        { cwd: 'apps/web', timeoutMs: 2 * 60_000 },
      )
      console.log('Preparing reserved database smoke account.')
      userId = await withDatabase((client) => ensureSmokeAccount(client, smokeCredentials))
    },
    async smoke(origin) {
      await smokeDeployment({
        origin,
        canonicalOrigin: target.origin,
        sha: env.GITHUB_SHA,
        ...smokeCredentials,
        userId,
        bypass,
      })
      console.log('Candidate database and authenticated session checked.')
    },
    async promote(candidate) {
      await command('vercel', ['promote', candidate, '--yes', ...cliAuth], {
        timeoutMs: 2 * 60_000,
      })
      console.log('Candidate promoted.')
    },
    async smokePublic() {
      await smokePublicDeployment({
        origin: target.origin,
        sha: env.GITHUB_SHA,
        ...smokeCredentials,
        userId,
        bypass,
      })
      console.log('Public domain and authenticated session checked.')
    },
  })
  if (env.GITHUB_STEP_SUMMARY)
    await appendFile(
      env.GITHUB_STEP_SUMMARY,
      `## Staging release\n\n- Commit: ${env.GITHUB_SHA}\n- Candidate: ${result.candidate}\n- Public URL: ${target.origin}\n- Migrations: ${result.pending.join(', ') || 'none'}\n- Database and authenticated session: passed\n`,
    )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    // Only known codes are logged; upstream exception messages may contain a connection URL.
    const prefix = (error.message ?? '').split(':')[0]
    const code = /^[A-Z][A-Z0-9_]+$/.test(prefix) ? prefix : 'STAGING_RELEASE_FAILED'
    console.error(code)
    process.exitCode = 1
  })
}
