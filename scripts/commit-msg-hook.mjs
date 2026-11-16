import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SKIP_ENV,
  appendTrailers,
  readSkipReason,
  skipTrailer,
  ticketFromBranch,
} from './local-validation-lib.mjs'

// Roda antes do commitlint: acrescenta `Refs: DTK-NNN` (da branch) e, se o commit foi feito com
// SKIP_PREPUSH="motivo", o trailer de auditoria `Tests-Skipped-By`. Merges e fixups ficam intactos.

export function enrichMessage({ message, branch, env, identity }) {
  if (/^(Merge |Revert "|fixup! |squash! |amend! )/.test(message)) return message
  const trailers = []
  const ticket = ticketFromBranch(branch)
  if (ticket) trailers.push(`Refs: ${ticket}`)
  const reason = readSkipReason(env)
  if (reason) trailers.push(skipTrailer({ ...identity, reason }))
  return trailers.length ? appendTrailers(message, trailers) : message
}

function main() {
  const file = process.argv[2]
  if (!file) throw new Error('Uso: commit-msg-hook.mjs <arquivo-da-mensagem>')
  const git = (...args) =>
    execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  const attempt = (...args) => {
    try {
      return git(...args)
    } catch {
      return ''
    }
  }
  const message = readFileSync(file, 'utf8')
  const next = enrichMessage({
    message,
    branch: attempt('rev-parse', '--abbrev-ref', 'HEAD'),
    env: process.env,
    identity: { name: attempt('config', 'user.name'), email: attempt('config', 'user.email') },
  })
  if (next !== message) writeFileSync(file, next)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(
      error.message.startsWith('SKIP_REASON')
        ? `${SKIP_ENV} precisa de um motivo real (8 a 200 caracteres, uma linha).`
        : error.message,
    )
    process.exitCode = 1
  }
}
