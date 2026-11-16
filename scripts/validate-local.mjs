import { execFileSync } from 'node:child_process'
import { ZERO_SHA } from './local-validation-lib.mjs'
import { runLocal } from './pre-push-validate.mjs'

// `npm run validate:local`: roda a suíte COMPLETA (inclui integração, Face Check e, conforme o diff,
// o motor Python e o E2E) no commit atual, sem precisar de um push. Se passar, grava a atestação
// "full" e a envia ao remoto: o CI então dispensa `quality` e `auth-e2e` para este conteúdo.

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const head = git('rev-parse', 'HEAD')
const branch = git('rev-parse', '--abbrev-ref', 'HEAD')

// Reaproveita o fluxo do pre-push simulando o push da branch atual como nova (remoto zerado).
const env = { ...process.env, KETRIS_VALIDATE_SCOPE: 'full' }
// Um skip não faz sentido aqui: o objetivo é justamente provar que a suíte passou.
delete env.SKIP_PREPUSH

process.exitCode = runLocal({
  input: `refs/heads/${branch} ${head} refs/heads/${branch} ${ZERO_SHA}\n`,
  env,
  remote: 'origin',
})
