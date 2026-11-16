import test from 'node:test'
import assert from 'node:assert/strict'
import { planValidation, protectedCiPaths, validateGate } from '../ci-validation-lib.mjs'
import { buildAttestation } from '../local-validation-lib.mjs'

const sha = 'a'.repeat(40)
const head = 'c'.repeat(40)
const tree = 'd'.repeat(40)
const before = 'b'.repeat(40)
const repository = 'done-Think/ketris'

function attestation(overrides = {}) {
  return buildAttestation({
    kind: 'passed',
    commit: head,
    tree,
    user: 'Alysson',
    email: 'a@b.co',
    at: '2026-11-15T12:00:00.000Z',
    checks: ['unit'],
    ...overrides,
  })
}

function prContext(extra = {}) {
  return {
    eventName: 'pull_request',
    ref: 'refs/pull/1/merge',
    repository,
    sha,
    tree,
    baseRef: 'dev',
    headSha: head,
    policyChanged: false,
    attestationFor: async (target) => (target === head ? attestation() : null),
    ...extra,
  }
}

test('PR para dev reaproveita a validação local do mesmo conteúdo', async () => {
  const result = await planValidation(prContext(), {})
  assert.equal(result.reuse, true)
  assert.equal(result.kind, 'attestation')
  assert.equal(result.reason, 'LOCAL_ATTESTATION')
  assert.equal(result.attestedBy, 'a@b.co')
})

test('PR sem atestação, com conteúdo diferente ou pulada roda a suíte completa', async () => {
  assert.equal(
    (await planValidation(prContext({ attestationFor: async () => null }), {})).reuse,
    false,
  )
  assert.equal((await planValidation(prContext({ tree: 'e'.repeat(40) }), {})).reuse, false)
  assert.equal(
    (
      await planValidation(
        prContext({
          attestationFor: async () =>
            attestation({ kind: 'skipped', reason: 'hotfix de produção' }),
        }),
        {},
      )
    ).reuse,
    false,
  )
  assert.equal((await planValidation(prContext({ baseRef: 'main' }), {})).reuse, false)
  assert.equal((await planValidation(prContext({ attestationFor: undefined }), {})).reuse, false)
})

test('push direto em dev com atestação do próprio commit reaproveita', async () => {
  const result = await planValidation(
    {
      eventName: 'push',
      ref: 'refs/heads/dev',
      repository,
      sha,
      tree,
      before,
      parent: 'f'.repeat(40),
      forced: false,
      policyChanged: false,
      attestationFor: async (target) => (target === sha ? attestation({ commit: sha }) : null),
    },
    {},
  )
  assert.equal(result.reuse, true)
  assert.equal(result.kind, 'attestation')
})

test('merge de PR em dev usa a atestação do commit de topo do PR', async () => {
  const pr = {
    number: 5,
    state: 'closed',
    merged: true,
    merged_at: '2026-11-15T11:59:00Z',
    merge_commit_sha: sha,
    head: { sha: head, repo: { full_name: repository } },
    base: { ref: 'dev', repo: { full_name: repository } },
  }
  const result = await planValidation(
    {
      eventName: 'push',
      ref: 'refs/heads/dev',
      repository,
      sha,
      tree,
      before,
      parent: before,
      forced: false,
      policyChanged: false,
      attestationFor: async (target) => (target === head ? attestation() : null),
    },
    { pullsForCommit: async () => [pr], pull: async () => pr },
  )
  assert.equal(result.reuse, true)
  assert.equal(result.kind, 'attestation')
})

test('mudança de política do CI ignora a atestação', async () => {
  const result = await planValidation(
    {
      eventName: 'push',
      ref: 'refs/heads/dev',
      repository,
      sha,
      tree,
      before,
      parent: before,
      forced: false,
      policyChanged: true,
      attestationFor: async () => attestation({ commit: sha }),
    },
    {},
  )
  assert.equal(result.reuse, false)
})

test('gate aceita reuso por atestação em PR e em push, e recusa o resto', () => {
  const base = {
    planResult: 'success',
    reuse: 'true',
    kind: 'attestation',
    qualityResult: 'skipped',
    e2eResult: 'skipped',
    tree,
    actualTree: tree,
  }
  assert.equal(
    validateGate({ ...base, eventName: 'pull_request', ref: 'refs/pull/1/merge' }),
    'attested',
  )
  assert.equal(validateGate({ ...base, eventName: 'push', ref: 'refs/heads/dev' }), 'attested')
  assert.throws(() => validateGate({ ...base, eventName: 'push', ref: 'refs/heads/main' }))
  assert.throws(() =>
    validateGate({ ...base, eventName: 'push', ref: 'refs/heads/dev', qualityResult: 'success' }),
  )
})

test('arquivos da política de validação local são protegidos', () => {
  for (const path of [
    'scripts/local-validation-lib.mjs',
    'scripts/pre-push-validate.mjs',
    '.husky',
  ]) {
    assert.ok(protectedCiPaths.includes(path), `falta ${path}`)
  }
})
