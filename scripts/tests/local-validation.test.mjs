import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ZERO_SHA,
  appendTrailers,
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
  skipTrailer,
  ticketFromBranch,
} from '../local-validation-lib.mjs'
import { runPrePush } from '../pre-push-validate.mjs'
import { enrichMessage } from '../commit-msg-hook.mjs'

const commit = 'a'.repeat(40)
const tree = 'b'.repeat(40)
const remote = 'c'.repeat(40)

function pushLine(overrides = {}) {
  const { localRef, localSha, remoteRef, remoteSha } = {
    localRef: 'refs/heads/feat/x',
    localSha: commit,
    remoteRef: 'refs/heads/feat/x',
    remoteSha: ZERO_SHA,
    ...overrides,
  }
  return `${localRef} ${localSha} ${remoteRef} ${remoteSha}\n`
}

test('parsePushRefs lê as linhas que o git envia ao pre-push', () => {
  const refs = parsePushRefs(pushLine() + pushLine({ remoteRef: 'refs/heads/dev' }))
  assert.equal(refs.length, 2)
  assert.deepEqual(refs[0], {
    localRef: 'refs/heads/feat/x',
    localSha: commit,
    remoteRef: 'refs/heads/feat/x',
    remoteSha: ZERO_SHA,
  })
  assert.deepEqual(parsePushRefs(''), [])
  assert.throws(() => parsePushRefs('lixo'), /INVALID_PUSH_REFS/)
})

test('isProtectedRef e isDeletion', () => {
  assert.equal(isProtectedRef('refs/heads/dev'), true)
  assert.equal(isProtectedRef('refs/heads/main'), true)
  assert.equal(isProtectedRef('refs/heads/feat/dev'), false)
  assert.equal(isDeletion({ localSha: ZERO_SHA }), true)
  assert.equal(isDeletion({ localSha: commit }), false)
})

test('needsE2E só pede navegador quando o diff toca o app', () => {
  assert.equal(needsE2E(['apps/web/src/app/page.tsx']), true)
  assert.equal(needsE2E(['apps/web/prisma/schema.prisma']), true)
  assert.equal(needsE2E(['apps/web/cypress/e2e/login.cy.ts']), true)
  assert.equal(needsE2E(['package-lock.json']), true)
  assert.equal(needsE2E(['README.md', 'docs/x.md', 'scripts/a.mjs', '.husky/pre-push']), false)
  assert.equal(needsE2E(['apps/web/README.md']), false)
  assert.equal(needsE2E([]), false)
})

test('readSkipReason exige um motivo de verdade', () => {
  assert.equal(readSkipReason({}), null)
  assert.equal(readSkipReason({ SKIP_PREPUSH: '' }), null)
  assert.equal(readSkipReason({ SKIP_PREPUSH: '  hotfix de produção  ' }), 'hotfix de produção')
  for (const weak of ['1', 'true', 'skip', 'x'.repeat(7)]) {
    assert.throws(() => readSkipReason({ SKIP_PREPUSH: weak }), /SKIP_REASON_TOO_SHORT/)
  }
  assert.throws(() => readSkipReason({ SKIP_PREPUSH: 'motivo\ncom quebra' }), /SKIP_REASON_INVALID/)
})

test('atestação: ida e volta, validação e reuso por conteúdo', () => {
  const attestation = buildAttestation({
    kind: 'passed',
    commit,
    tree,
    user: 'Alysson',
    email: 'a@b.co',
    at: '2026-11-15T12:00:00.000Z',
    checks: ['unit', 'integration'],
    scope: 'full',
  })
  const parsed = parseAttestation(JSON.stringify(attestation))
  assert.deepEqual(parsed, attestation)
  assert.equal(parsed.scope, 'full')
  assert.equal(attestationReusable(parsed, { commit, tree }), true)
  assert.equal(attestationReusable(parsed, { commit, tree: 'd'.repeat(40) }), false)
  assert.equal(attestationReusable(parsed, { commit: 'd'.repeat(40), tree }), false)

  const skipped = buildAttestation({
    kind: 'skipped',
    commit,
    tree,
    user: 'Alysson',
    email: 'a@b.co',
    at: '2026-11-15T12:00:00.000Z',
    reason: 'hotfix de produção',
  })
  assert.equal(attestationReusable(skipped, { commit, tree }), false)
  assert.throws(
    () => buildAttestation({ kind: 'skipped', commit, tree, user: 'a', email: 'a@b.co', at: 'x' }),
    /SKIP_REASON_REQUIRED/,
  )
})

test('atestação rápida (pre-push padrão) não dispensa a suíte do CI', () => {
  const fast = buildAttestation({
    kind: 'passed',
    commit,
    tree,
    user: 'Alysson',
    email: 'a@b.co',
    at: '2026-11-15T12:00:00.000Z',
    checks: ['unit'],
  })
  assert.equal(fast.scope, 'fast')
  assert.equal(attestationReusable(fast, { commit, tree }), false)

  // Notas antigas, gravadas antes do campo `scope`, também contam como rápidas.
  const legacy = parseAttestation(
    JSON.stringify({
      version: 1,
      kind: 'passed',
      commit,
      tree,
      user: 'a',
      email: 'a@b.co',
      at: 'x',
      checks: [],
    }),
  )
  assert.equal(legacy.scope, 'fast')
  assert.equal(attestationReusable(legacy, { commit, tree }), false)
})

test('parseAttestation rejeita dados malformados', () => {
  assert.equal(parseAttestation('não é json'), null)
  assert.equal(parseAttestation('{}'), null)
  assert.equal(
    parseAttestation(JSON.stringify({ version: 1, kind: 'passed', commit: 'x', tree })),
    null,
  )
  assert.equal(parseAttestation(JSON.stringify({ version: 2, kind: 'passed', commit, tree })), null)
})

test('noteRef é único por commit', () => {
  assert.equal(noteRef(commit), `refs/notes/lv/${commit}`)
  assert.throws(() => noteRef('zzz'), /INVALID_COMMIT/)
})

test('ticketFromBranch extrai o DTK da branch', () => {
  assert.equal(ticketFromBranch('dtk-177-property-access'), 'DTK-177')
  assert.equal(ticketFromBranch('feat/dtk-177-property-access'), 'DTK-177')
  assert.equal(ticketFromBranch('fix/DTK-9'), 'DTK-9')
  assert.equal(ticketFromBranch('dev'), null)
  assert.equal(ticketFromBranch('feature/sem-ticket'), null)
})

test('appendTrailers monta o bloco de rodapé sem duplicar', () => {
  assert.equal(
    appendTrailers('feat(auth): add x', ['Refs: DTK-1']),
    'feat(auth): add x\n\nRefs: DTK-1\n',
  )
  assert.equal(
    appendTrailers('feat(auth): add x\n\nPorque sim.\n', ['Refs: DTK-1']),
    'feat(auth): add x\n\nPorque sim.\n\nRefs: DTK-1\n',
  )
  assert.equal(
    appendTrailers('feat(auth): add x\n\nRefs: DTK-1\n', [
      'Tests-Skipped-By: A <a@b.co> — motivo longo',
    ]),
    'feat(auth): add x\n\nRefs: DTK-1\nTests-Skipped-By: A <a@b.co> — motivo longo\n',
  )
  assert.equal(
    appendTrailers('feat(auth): add x\n\nRefs: DTK-2\n', ['Refs: DTK-1']),
    'feat(auth): add x\n\nRefs: DTK-2\n',
  )
  assert.equal(
    appendTrailers('feat(auth): add x\n\n# Please enter\n# comment\n', ['Refs: DTK-1']),
    'feat(auth): add x\n\nRefs: DTK-1\n',
  )
})

test('skipTrailer formata autor e motivo', () => {
  assert.equal(
    skipTrailer({ name: 'Alysson Sene', email: 'a@b.co', reason: 'hotfix de produção' }),
    'Tests-Skipped-By: Alysson Sene <a@b.co> — hotfix de produção',
  )
})

test('buildChecks rápido (padrão) só traz o que cabe em 1 a 2 minutos', () => {
  const fast = buildChecks({ e2e: true, engine: true }).map((check) => check.id)
  for (const id of ['conventions', 'api', 'typecheck', 'lint', 'unit']) {
    assert.ok(fast.includes(id), `falta ${id}`)
  }
  for (const id of ['integration', 'face-check', 'engine', 'e2e']) {
    assert.equal(fast.includes(id), false, `${id} não deve rodar no pre-push rápido`)
  }
  assert.ok(fast.indexOf('typecheck') < fast.indexOf('unit'))
})

test('buildChecks completo inclui integração e só pede E2E e motor quando o diff pede', () => {
  const without = buildChecks({ scope: 'full' }).map((check) => check.id)
  const withE2E = buildChecks({ scope: 'full', e2e: true }).map((check) => check.id)
  for (const id of ['unit', 'integration', 'face-check']) {
    assert.ok(without.includes(id), `falta ${id}`)
  }
  assert.equal(without.includes('e2e'), false)
  assert.equal(withE2E.at(-1), 'e2e')
  assert.ok(buildChecks({ scope: 'full', engine: true }).some((check) => check.id === 'engine'))
})

test('buildChecks dá mais memória ao typecheck e ao lint (o tsc estoura o heap padrão)', () => {
  for (const id of ['typecheck', 'lint']) {
    const check = buildChecks().find((entry) => entry.id === id)
    assert.match(check.env?.NODE_OPTIONS ?? '', /--max-old-space-size=\d{4,}/, id)
  }
})

// ---- hook de mensagem de commit --------------------------------------------------------------

const identity = { name: 'Alysson Sene', email: 'a@b.co' }

test('commit-msg: preenche Refs a partir da branch dtk-NNN', () => {
  assert.equal(
    enrichMessage({
      message: 'fix(auth): reject expired invitations\n',
      branch: 'feat/dtk-177-property-access',
      env: {},
      identity,
    }),
    'fix(auth): reject expired invitations\n\nRefs: DTK-177\n',
  )
})

test('commit-msg: sem ticket na branch a mensagem não muda', () => {
  const message = 'fix(auth): reject expired invitations\n'
  assert.equal(enrichMessage({ message, branch: 'dev', env: {}, identity }), message)
})

test('commit-msg: merges e fixups ficam intactos', () => {
  for (const message of ["Merge branch 'x' into dev\n", 'fixup! fix(auth): a b c\n']) {
    assert.equal(
      enrichMessage({
        message,
        branch: 'dtk-1-x',
        env: { SKIP_PREPUSH: 'hotfix de produção' },
        identity,
      }),
      message,
    )
  }
})

test('commit-msg: skip no commit registra quem pulou como trailer', () => {
  assert.equal(
    enrichMessage({
      message: 'fix(auth): hotfix now\n',
      branch: 'dtk-9-hotfix',
      env: { SKIP_PREPUSH: 'hotfix de produção' },
      identity,
    }),
    'fix(auth): hotfix now\n\nRefs: DTK-9\nTests-Skipped-By: Alysson Sene <a@b.co> — hotfix de produção\n',
  )
  assert.throws(
    () =>
      enrichMessage({
        message: 'fix(auth): hotfix now\n',
        branch: 'dev',
        env: { SKIP_PREPUSH: '1' },
        identity,
      }),
    /SKIP_REASON_TOO_SHORT/,
  )
})

// ---- orquestração do pre-push ----------------------------------------------------------------

function harness({
  input,
  env = {},
  files = ['apps/web/src/a.ts'],
  failing,
  ancestor = true,
  head = commit,
  dirty = '',
  existingNote,
} = {}) {
  const calls = { git: [], run: [], logs: [] }
  const git = (...args) => {
    calls.git.push(args.join(' '))
    const joined = args.join(' ')
    if (joined === 'rev-parse HEAD') return head
    if (joined === `rev-parse ${commit}^{tree}`) return tree
    if (joined === 'config user.name') return 'Alysson'
    if (joined === 'config user.email') return 'a@b.co'
    if (joined.startsWith('status --porcelain')) return dirty
    if (joined.startsWith('diff --name-only')) return files.join('\n')
    if (joined.startsWith('merge-base --is-ancestor')) {
      if (!ancestor) throw new Error('not ancestor')
      return ''
    }
    if (joined.startsWith('notes --ref') && joined.includes(' show ')) {
      if (!existingNote) throw new Error('no note')
      return existingNote
    }
    if (joined.startsWith('cat-file -e')) return ''
    if (joined.startsWith('merge-base')) return remote
    return ''
  }
  const run = (check) => {
    calls.run.push(check.id)
    return { status: check.id === failing ? 1 : 0 }
  }
  const log = (message) => calls.logs.push(message)
  return {
    calls,
    execute: () =>
      runPrePush({
        input,
        env,
        remote: 'origin',
        git,
        run,
        log,
        now: () => new Date('2026-11-15T12:00:00.000Z'),
      }),
  }
}

function noteWrites(calls) {
  return calls.git.filter((line) => line.includes('notes') && line.includes(' add '))
}

test('pre-push: padrão é rápido, grava atestação "fast" e envia a nota', () => {
  const h = harness({ input: pushLine() })
  assert.equal(h.execute(), 0)
  assert.ok(h.calls.run.includes('unit'))
  for (const id of ['integration', 'face-check', 'e2e']) {
    assert.equal(h.calls.run.includes(id), false, id)
  }
  const writes = noteWrites(h.calls)
  assert.equal(writes.length, 1)
  assert.match(writes[0], /"scope":"fast"/)
  assert.ok(h.calls.git.some((line) => line.startsWith('push --no-verify origin')))
})

test('pre-push: escopo completo (validate:local) roda integração e E2E e grava "full"', () => {
  const h = harness({ input: pushLine(), env: { KETRIS_VALIDATE_SCOPE: 'full' } })
  assert.equal(h.execute(), 0)
  for (const id of ['unit', 'integration', 'face-check', 'e2e']) {
    assert.ok(h.calls.run.includes(id), id)
  }
  assert.match(noteWrites(h.calls)[0], /"scope":"full"/)
})

test('pre-push: escopo completo não roda E2E quando o diff não toca o app', () => {
  const h = harness({
    input: pushLine(),
    env: { KETRIS_VALIDATE_SCOPE: 'full' },
    files: ['README.md', 'docs/a.md'],
  })
  assert.equal(h.execute(), 0)
  assert.equal(h.calls.run.includes('e2e'), false)
  assert.ok(h.calls.run.includes('integration'))
})

test('pre-push: teste quebrado bloqueia o push e não grava atestação', () => {
  const h = harness({ input: pushLine(), failing: 'unit' })
  assert.equal(h.execute(), 1)
  assert.equal(noteWrites(h.calls).length, 0)
  assert.equal(h.calls.run.includes('e2e'), false)
})

test('pre-push: árvore suja ou HEAD diferente do que será enviado bloqueia', () => {
  assert.equal(harness({ input: pushLine(), dirty: ' M apps/web/a.ts' }).execute(), 1)
  assert.equal(harness({ input: pushLine(), head: 'e'.repeat(40) }).execute(), 1)
})

test('pre-push: force push em dev/main é bloqueado sem motivo', () => {
  const h = harness({
    input: pushLine({ localRef: 'refs/heads/dev', remoteRef: 'refs/heads/dev', remoteSha: remote }),
    ancestor: false,
  })
  assert.equal(h.execute(), 1)
  assert.equal(h.calls.run.length, 0)
})

test('pre-push: remoção de branch passa direto', () => {
  const h = harness({ input: pushLine({ localSha: ZERO_SHA }) })
  assert.equal(h.execute(), 0)
  assert.equal(h.calls.run.length, 0)
})

test('pre-push: skip com motivo registra quem pulou e não roda testes', () => {
  const h = harness({ input: pushLine(), env: { SKIP_PREPUSH: 'hotfix de produção' } })
  assert.equal(h.execute(), 0)
  assert.equal(h.calls.run.length, 0)
  const writes = noteWrites(h.calls)
  assert.equal(writes.length, 1)
  assert.match(writes[0], /"kind":"skipped"/)
  assert.match(writes[0], /a@b\.co/)
  assert.match(writes[0], /hotfix de produção/)
  assert.ok(h.calls.git.some((line) => line.startsWith('push --no-verify origin')))
})

test('pre-push: skip com motivo fraco é recusado', () => {
  const h = harness({ input: pushLine(), env: { SKIP_PREPUSH: '1' } })
  assert.equal(h.execute(), 1)
  assert.equal(noteWrites(h.calls).length, 0)
})

test('pre-push: force push em dev com skip fica registrado como force', () => {
  const h = harness({
    input: pushLine({ localRef: 'refs/heads/dev', remoteRef: 'refs/heads/dev', remoteSha: remote }),
    ancestor: false,
    env: { SKIP_PREPUSH: 'recuperação de histórico' },
  })
  assert.equal(h.execute(), 0)
  assert.match(noteWrites(h.calls)[0], /"forced":true/)
})

function noteJson(overrides = {}) {
  return JSON.stringify(
    buildAttestation({
      kind: 'passed',
      commit,
      tree,
      user: 'Alysson',
      email: 'a@b.co',
      at: '2026-11-15T12:00:00.000Z',
      checks: ['unit'],
      ...overrides,
    }),
  )
}

test('pre-push: reaproveita a atestação local já aprovada e só reenvia a nota', () => {
  const h = harness({ input: pushLine(), existingNote: noteJson() })
  assert.equal(h.execute(), 0)
  assert.equal(h.calls.run.length, 0)
  assert.equal(noteWrites(h.calls).length, 0)
  assert.ok(h.calls.git.some((line) => line.startsWith('push --no-verify origin')))
})

test('pre-push: escopo completo não aceita atestação rápida, mas aceita a completa', () => {
  const full = { KETRIS_VALIDATE_SCOPE: 'full' }
  const onFast = harness({ input: pushLine(), env: full, existingNote: noteJson() })
  onFast.execute()
  assert.ok(onFast.calls.run.includes('integration'))

  const onFull = harness({
    input: pushLine(),
    env: full,
    existingNote: noteJson({ scope: 'full' }),
  })
  assert.equal(onFull.execute(), 0)
  assert.equal(onFull.calls.run.length, 0)
})

test('pre-push: atestação local pulada ou de outro conteúdo não é reaproveitada', () => {
  const skipped = noteJson({ kind: 'skipped', checks: undefined, reason: 'hotfix de produção' })
  assert.ok(harness({ input: pushLine(), existingNote: skipped }).execute() === 0)
  const skippedRun = harness({ input: pushLine(), existingNote: skipped })
  skippedRun.execute()
  assert.ok(skippedRun.calls.run.includes('unit'))

  const otherTree = harness({ input: pushLine(), existingNote: noteJson({ tree: 'e'.repeat(40) }) })
  otherTree.execute()
  assert.ok(otherTree.calls.run.includes('unit'))
})

test('pre-push: não recursa quando o próprio hook empurra a nota', () => {
  const h = harness({ input: pushLine(), env: { KETRIS_PREPUSH_ACTIVE: '1' } })
  assert.equal(h.execute(), 0)
  assert.equal(h.calls.run.length, 0)
})
