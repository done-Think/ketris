import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ZERO_SHA,
  attestationReusable,
  buildAttestation,
  buildChecks,
  isDeletion,
  isProtectedRef,
  needsE2E,
  noteRef,
  parseAttestation,
  parsePushRefs,
  readSkipReason,
} from './local-validation-lib.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const engineDir = 'services/face_check_engine/'

function isAncestor(git, ancestor, descendant) {
  try {
    git('cat-file', '-e', `${ancestor}^{commit}`)
    git('merge-base', '--is-ancestor', ancestor, descendant)
    return true
  } catch {
    return false
  }
}

// Arquivos alterados em relação ao que o remoto já tem (ou à dev, em branch nova). `null` = não deu
// para saber, e então a suíte roda por inteiro.
function changedFiles(git, entry) {
  try {
    let base = null
    if (entry.remoteSha !== ZERO_SHA) {
      try {
        git('cat-file', '-e', `${entry.remoteSha}^{commit}`)
        base = entry.remoteSha
      } catch {
        base = null
      }
    }
    base ??= git('merge-base', 'origin/dev', entry.localSha)
    return git('diff', '--name-only', base, entry.localSha).split('\n').filter(Boolean)
  } catch {
    return null
  }
}

// Um push que falhou depois dos testes (conexão SSH ociosa, rede) não deve repetir a suíte: se o
// commit já tem uma atestação local `passed` para o mesmo conteúdo, ela é reaproveitada.
function alreadyAttested(git, commit) {
  try {
    const attestation = parseAttestation(git('notes', '--ref', noteRef(commit), 'show', commit))
    return attestationReusable(attestation, { commit, tree: git('rev-parse', `${commit}^{tree}`) })
  } catch {
    return false
  }
}

function writeNotes({ git, remote, log, commits, build }) {
  for (const commit of commits) {
    const ref = noteRef(commit)
    git('notes', '--ref', ref, 'add', '-f', '-m', JSON.stringify(build(commit)), commit)
  }
  pushNotes({ git, remote, log, commits })
}

function pushNotes({ git, remote, log, commits }) {
  const refs = commits.map((commit) => `${noteRef(commit)}:${noteRef(commit)}`)
  try {
    git('push', '--no-verify', remote, ...refs)
  } catch {
    // Sem a nota o push segue, e o CI roda a suíte completa para esse commit.
    log('Aviso: não consegui enviar a atestação; o CI vai rodar a suíte completa.')
  }
}

export function runPrePush({ input, env, remote, git, run, log, now }) {
  if (env.KETRIS_PREPUSH_ACTIVE === '1') return 0

  let refs
  let reason
  try {
    refs = parsePushRefs(input)
    reason = readSkipReason(env)
  } catch (error) {
    log(
      error.message === 'SKIP_REASON_TOO_SHORT'
        ? 'SKIP_PREPUSH precisa de um motivo real (mínimo de 8 caracteres), não um "1" ou "true".'
        : error.message === 'SKIP_REASON_INVALID'
          ? 'SKIP_PREPUSH deve ter uma linha só e até 200 caracteres.'
          : 'Entrada do pre-push inválida.',
    )
    return 1
  }

  const pushed = refs.filter((entry) => !isDeletion(entry))
  if (pushed.length === 0) return 0

  const forced = pushed.filter(
    (entry) =>
      isProtectedRef(entry.remoteRef) &&
      entry.remoteSha !== ZERO_SHA &&
      !isAncestor(git, entry.remoteSha, entry.localSha),
  )
  if (forced.length > 0 && !reason) {
    log(
      `Push forçado em ${forced.map((entry) => entry.remoteRef).join(', ')} bloqueado. ` +
        'Se for realmente necessário: SKIP_PREPUSH="motivo" git push --force-with-lease (fica registrado).',
    )
    return 1
  }

  const commits = [...new Set(pushed.map((entry) => entry.localSha))]
  const user = git('config', 'user.name')
  const email = git('config', 'user.email')
  const at = now().toISOString()
  const build = (kind, extra) => (commit) =>
    buildAttestation({
      kind,
      commit,
      tree: git('rev-parse', `${commit}^{tree}`),
      user,
      email,
      at,
      ...extra,
    })

  if (reason) {
    log(`Validação local PULADA por ${user} <${email}>: ${reason}`)
    writeNotes({
      git,
      remote,
      log,
      commits,
      build: build('skipped', { reason, forced: forced.length > 0 }),
    })
    return 0
  }

  if (commits.length !== 1 || git('rev-parse', 'HEAD') !== commits[0]) {
    log('O commit enviado precisa ser o HEAD atual: a suíte valida o que está no seu disco.')
    return 1
  }
  if (git('status', '--porcelain', '--untracked-files=no')) {
    log(
      'Há alterações não commitadas em arquivos rastreados; commite ou guarde (stash) antes do push.',
    )
    return 1
  }

  if (commits.every((commit) => alreadyAttested(git, commit))) {
    log('Validação local já aprovada para este commit; reaproveitando sem rodar os testes de novo.')
    pushNotes({ git, remote, log, commits })
    return 0
  }

  const files = pushed.flatMap((entry) => changedFiles(git, entry) ?? [null])
  const unknown = files.includes(null)
  const known = files.filter(Boolean)
  const checks = buildChecks({
    e2e: unknown || needsE2E(known),
    engine: unknown || known.some((file) => file.startsWith(engineDir)),
  })

  for (const check of checks) {
    log(`\n▶ ${check.label}`)
    if (run(check).status !== 0) {
      log(`\n✖ ${check.label} falhou — push cancelado. Corrija e tente de novo.`)
      return 1
    }
  }

  writeNotes({
    git,
    remote,
    log,
    commits,
    build: build('passed', { checks: checks.map((check) => check.id) }),
  })
  log('\n✔ Validação local aprovada; o CI pode reaproveitar este resultado.')
  return 0
}

function main() {
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  const run = (check) =>
    spawnSync(check.cmd, check.args, {
      cwd: check.cwd ? resolve(root, check.cwd) : root,
      env: { ...process.env, ...check.env },
      stdio: 'inherit',
    })
  process.exitCode = runPrePush({
    input: readFileSync(0, 'utf8'),
    env: process.env,
    remote: process.argv[2] ?? 'origin',
    git,
    run,
    log: (message) => console.error(message),
    now: () => new Date(),
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
