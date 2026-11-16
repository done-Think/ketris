import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))

function lint(message) {
  const result = spawnSync('npx', ['--no-install', 'commitlint'], {
    cwd: root,
    input: message,
    encoding: 'utf8',
  })
  return { ok: result.status === 0, output: `${result.stdout}${result.stderr}` }
}

test('aceita o padrão do projeto', () => {
  assert.equal(lint('feat(auth): add refresh token rotation').ok, true)
  assert.equal(lint('fix(face-check): reject expired invitations\n\nRefs: DTK-12').ok, true)
  assert.equal(lint('test(e2e): pick the destination field').ok, true)
})

test('exige escopo', () => {
  const result = lint('fix: reject expired invitations')
  assert.equal(result.ok, false)
  assert.match(result.output, /scope may not be empty/)
})

test('restringe o escopo à lista e recusa face_check', () => {
  assert.equal(lint('fix(face_check): x y z').ok, false)
  assert.equal(lint('fix(inventado): x y z').ok, false)
  assert.equal(lint('fix(face-check): x y z').ok, true)
})

test('assunto sem ponto final, em minúsculas e até 100 caracteres', () => {
  assert.equal(lint('fix(auth): reject expired invitations.').ok, false)
  assert.equal(lint('fix(auth): Reject expired invitations').ok, false)
  assert.equal(lint(`fix(auth): ${'a'.repeat(95)}`).ok, false)
})

test('Tests-Skipped-By precisa de autor com e-mail e motivo', () => {
  const ok = 'fix(auth): hotfix now\n\nTests-Skipped-By: Alysson <a@b.co> — hotfix de produção'
  assert.equal(lint(ok).ok, true)
  assert.equal(lint('fix(auth): hotfix now\n\nTests-Skipped-By: Alysson').ok, false)
  assert.equal(lint('fix(auth): hotfix now\n\nTests-Skipped-By: Alysson <a@b.co> — x').ok, false)
})

test('ignora commits de merge', () => {
  assert.equal(lint("Merge remote-tracking branch 'origin/dev' into fix/x").ok, true)
})
