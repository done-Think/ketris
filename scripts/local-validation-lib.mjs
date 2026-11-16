// Regras puras da validação local (pre-push) e da auditoria de skip. Nada aqui toca o disco nem o
// git: `pre-push-validate.mjs` e `commit-msg-hook.mjs` injetam as dependências, e o CI reutiliza
// `parseAttestation`/`attestationReusable` para decidir se pode pular a suíte.

export const ZERO_SHA = '0'.repeat(40)
export const SKIP_ENV = 'SKIP_PREPUSH'
export const MIN_SKIP_REASON = 8
const MAX_SKIP_REASON = 200
const shaPattern = /^[a-f0-9]{40}$/
const protectedRefs = new Set(['refs/heads/dev', 'refs/heads/main'])

function isSha(value) {
  return typeof value === 'string' && shaPattern.test(value)
}

export function parsePushRefs(text) {
  const refs = []
  for (const line of String(text).split('\n')) {
    if (!line.trim()) continue
    const [localRef, localSha, remoteRef, remoteSha, ...extra] = line.trim().split(/\s+/)
    if (extra.length || !localRef || !remoteRef || !isSha(localSha) || !isSha(remoteSha))
      throw new Error('INVALID_PUSH_REFS')
    refs.push({ localRef, localSha, remoteRef, remoteSha })
  }
  return refs
}

export function isProtectedRef(ref) {
  return protectedRefs.has(ref)
}

export function isDeletion(entry) {
  return entry.localSha === ZERO_SHA
}

// O E2E só roda quando o diff pode afetar o app: qualquer arquivo de apps/web (exceto docs) ou o
// manifesto/lockfile da raiz. Scripts, docs e hooks não passam pelo navegador.
export function needsE2E(files) {
  return files.some(
    (file) =>
      (file.startsWith('apps/web/') && !file.endsWith('.md')) ||
      file === 'package.json' ||
      file === 'package-lock.json',
  )
}

export function readSkipReason(env) {
  const raw = env[SKIP_ENV]
  if (raw === undefined || raw.trim() === '') return null
  if (/[\r\n]/.test(raw) || raw.length > MAX_SKIP_REASON) throw new Error('SKIP_REASON_INVALID')
  const reason = raw.trim()
  if (reason.length < MIN_SKIP_REASON) throw new Error('SKIP_REASON_TOO_SHORT')
  return reason
}

export function noteRef(commit) {
  if (!isSha(commit)) throw new Error('INVALID_COMMIT')
  return `refs/notes/lv/${commit}`
}

export function buildAttestation({ kind, commit, tree, user, email, at, checks, reason, forced }) {
  if (!['passed', 'skipped'].includes(kind)) throw new Error('INVALID_ATTESTATION_KIND')
  if (kind === 'skipped' && !reason) throw new Error('SKIP_REASON_REQUIRED')
  return {
    version: 1,
    kind,
    commit,
    tree,
    user,
    email,
    at,
    ...(kind === 'passed' ? { checks: checks ?? [] } : { reason }),
    ...(forced ? { forced: true } : {}),
  }
}

export function parseAttestation(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (
    !data ||
    data.version !== 1 ||
    !['passed', 'skipped'].includes(data.kind) ||
    !isSha(data.commit) ||
    !isSha(data.tree) ||
    typeof data.user !== 'string' ||
    typeof data.email !== 'string' ||
    typeof data.at !== 'string'
  )
    return null
  if (data.kind === 'skipped' && typeof data.reason !== 'string') return null
  try {
    return buildAttestation({
      ...data,
      checks: Array.isArray(data.checks) ? data.checks.map(String) : undefined,
    })
  } catch {
    return null
  }
}

// Só uma atestação "passed" do mesmo commit e do mesmo conteúdo (tree) dispensa a suíte do CI.
export function attestationReusable(attestation, { commit, tree }) {
  return (
    attestation?.kind === 'passed' && attestation.commit === commit && attestation.tree === tree
  )
}

export function ticketFromBranch(branch) {
  const match = /(?:^|\/)dtk-(\d+)/i.exec(branch ?? '')
  return match ? `DTK-${match[1]}` : null
}

export function skipTrailer({ name, email, reason }) {
  return `Tests-Skipped-By: ${name} <${email}> — ${reason}`
}

const trailerLine = /^[A-Za-z][A-Za-z-]*: .+/

export function appendTrailers(message, trailers) {
  const lines = message.replace(/\r\n/g, '\n').split('\n')
  while (lines.length && (lines.at(-1).trim() === '' || lines.at(-1).startsWith('#'))) lines.pop()
  const lastBlank = lines.lastIndexOf('')
  const block = lastBlank > 0 ? lines.slice(lastBlank + 1) : []
  const hasBlock = block.length > 0 && block.every((line) => trailerLine.test(line))
  const keys = new Set(
    (hasBlock ? block : []).map((line) => line.slice(0, line.indexOf(':')).toLowerCase()),
  )
  const added = trailers.filter((trailer) => {
    const key = trailer.slice(0, trailer.indexOf(':')).toLowerCase()
    if (keys.has(key)) return false
    keys.add(key)
    return true
  })
  if (added.length) {
    if (!hasBlock) lines.push('')
    lines.push(...added)
  }
  return lines.join('\n') + '\n'
}

const e2eSpecs = [
  'auth',
  'agenda',
  'contracts',
  'crm',
  'face_check',
  'maintenance',
  'financial',
  'properties',
  'marketplace',
  'platform',
  'team',
]
export const e2eSpecGlob = [
  ...e2eSpecs.map((name) => `cypress/e2e/${name}/**/*.cy.ts`),
  'cypress/e2e/login.cy.ts',
].join(',')

// O `tsc` do projeto passa de ~2 GB de heap (o padrão do Node em muitas máquinas) e aborta com
// "heap out of memory"; o runner do CI tem mais memória e não sofre com isso.
const heavyNodeEnv = { NODE_OPTIONS: '--max-old-space-size=4096' }

const withDatabase = (...command) => ({
  cmd: process.execPath,
  args: ['scripts/run-with-temp-db.mjs', '--', ...command],
})

// Mesma ordem do job `quality` + `auth-e2e` do CI. Cada passo é um único comando.
export function buildChecks({ e2e = false, engine = false } = {}) {
  const checks = [
    {
      id: 'english-names',
      label: 'Nomes em inglês',
      cmd: 'npm',
      args: ['run', 'check:english-names'],
    },
    {
      id: 'conventions',
      label: 'Convenções de código',
      cmd: 'npm',
      args: ['run', 'check:conventions'],
    },
    {
      id: 'scripts',
      label: 'Testes dos scripts de operação',
      cmd: process.execPath,
      args: [
        '--test',
        'scripts/tests/code-conventions.test.mjs',
        'scripts/tests/ci-validation.test.mjs',
        'scripts/tests/ci-local-attestation.test.mjs',
        'scripts/tests/local-validation.test.mjs',
        'scripts/tests/commitlint-config.test.mjs',
        'scripts/tests/staging-release.test.mjs',
        'scripts/tests/explore-staging-rate-limit.test.mjs',
        'scripts/tests/face-check-retention.test.mjs',
        'scripts/tests/face-check-invitation-emails.test.mjs',
        'scripts/tests/face-check-analysis.test.mjs',
      ],
    },
    { id: 'api', label: 'Contrato OpenAPI e tipos', cmd: 'npm', args: ['run', 'api:check'] },
    {
      id: 'typecheck',
      label: 'Typecheck',
      cmd: 'npm',
      args: ['run', 'typecheck', '-w', '@ketris/web'],
      env: heavyNodeEnv,
    },
    {
      id: 'lint',
      label: 'Lint',
      cmd: 'npm',
      args: ['run', 'lint', '-w', '@ketris/web'],
      env: heavyNodeEnv,
    },
    {
      id: 'unit',
      label: 'Testes unitários',
      ...withDatabase('npm', 'run', 'test:run', '-w', '@ketris/web'),
    },
    {
      id: 'integration',
      label: 'Testes de integração',
      ...withDatabase('npm', 'run', 'test:integration', '-w', '@ketris/web'),
    },
    {
      id: 'face-check',
      label: 'Face Check em banco descartável',
      cmd: 'npm',
      args: ['run', 'face-check:test:integration'],
    },
  ]
  if (engine) {
    checks.push({
      id: 'engine',
      label: 'Motor Face Check (Python)',
      // Mesmos quatro módulos do CI: os demais exigem os modelos pesados do motor.
      cmd: 'sh',
      args: [
        '-c',
        ['request_limits', 'http_service', 'startup', 'metrics']
          .map((name) => `python3 -m unittest discover -s tests -p 'test_${name}.py'`)
          .join(' && '),
      ],
      cwd: 'services/face_check_engine',
    })
  }
  if (e2e) {
    checks.push({
      id: 'e2e',
      label: 'E2E (build + Cypress)',
      cmd: process.execPath,
      args: ['scripts/run-local-e2e.mjs'],
    })
  }
  return checks
}
