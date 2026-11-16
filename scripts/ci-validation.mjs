import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createGithubApi,
  evidenceName,
  isCommitSha,
  planValidation,
  protectedCiPaths,
  validateGate,
} from './ci-validation-lib.mjs'
import { noteRef, parseAttestation } from './local-validation-lib.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))

// A atestação do pre-push vive num git note por commit (refs/notes/lv/<sha>). Qualquer falha de
// leitura vira "sem atestação", e então a suíte completa roda.
function readAttestation(git, commit) {
  try {
    const ref = noteRef(commit)
    git('fetch', '--no-tags', '--quiet', 'origin', `+${ref}:${ref}`)
    const line = git('notes', '--ref', ref, 'list')
      .split('\n')
      .find((entry) => entry.endsWith(` ${commit}`))
    return line ? parseAttestation(git('cat-file', '-p', line.split(' ')[0])) : null
  } catch {
    return null
  }
}
// Texto vindo do desenvolvedor (motivo do skip) nunca pode virar comando de workflow nem markdown.
function escapeCommand(text) {
  return String(text).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
}
function inline(text) {
  return String(text).replace(/[`\r\n]/g, ' ')
}
function output(values, env) {
  if (!env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT_REQUIRED')
  for (const [key, value] of Object.entries(values)) {
    if (/[\r\n]/.test(String(value))) throw new Error('INVALID_ACTION_OUTPUT')
    appendFileSync(env.GITHUB_OUTPUT, `${key}=${value}\n`)
  }
}
function source(env, git) {
  if (!isCommitSha(env.GITHUB_SHA) || git('rev-parse', 'HEAD') !== env.GITHUB_SHA)
    throw new Error('CHECKOUT_SHA_MISMATCH')
  return git('rev-parse', 'HEAD^{tree}')
}
function event(env) {
  return JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'))
}
function summary(text, env) {
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, text + '\n')
}

export async function runCli(mode, env = process.env, job, { cwd = root, fetchImpl = fetch } = {}) {
  const git = (...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  const tree = source(env, git)
  if (mode === 'plan') {
    const payload = event(env)
    let parent
    let policyChanged = true
    try {
      parent = git('cat-file', '-p', 'HEAD')
        .split('\n')
        .find((line) => line.startsWith('parent '))
        ?.slice(7)
      if (isCommitSha(payload.before)) {
        policyChanged =
          git('diff', '--name-only', payload.before, env.GITHUB_SHA, '--', ...protectedCiPaths) !==
          ''
      } else if (env.GITHUB_EVENT_NAME === 'pull_request') {
        // O checkout de PR é o merge commit; o primeiro pai é a base.
        policyChanged =
          git('diff', '--name-only', 'HEAD^1', 'HEAD', '--', ...protectedCiPaths) !== ''
      }
    } catch {
      /* Unavailable history runs full CI. */
    }
    const attestations = new Map()
    const attestationFor = async (commit) => {
      if (!attestations.has(commit)) attestations.set(commit, readAttestation(git, commit))
      return attestations.get(commit)
    }
    const context = {
      baseRef: payload.pull_request?.base?.ref,
      headSha: payload.pull_request?.head?.sha,
      attestationFor,
      eventName: env.GITHUB_EVENT_NAME,
      ref: env.GITHUB_REF,
      repository: env.GITHUB_REPOSITORY,
      sha: env.GITHUB_SHA,
      tree,
      parent,
      before: payload.before,
      forced: payload.forced,
      policyChanged,
    }
    let result
    try {
      result = await planValidation(
        context,
        env.GITHUB_EVENT_NAME === 'push' && env.GITHUB_REF === 'refs/heads/dev'
          ? createGithubApi({
              repository: env.GITHUB_REPOSITORY,
              token: env.GITHUB_TOKEN,
              fetchImpl,
            })
          : {},
      )
    } catch {
      result = { reuse: false, reason: 'GITHUB_EVIDENCE_UNAVAILABLE' }
    }
    output(
      {
        reuse: String(result.reuse),
        kind: result.kind ?? '',
        tree,
        reason: result.reason,
        source_run: result.sourceRun ?? '',
      },
      env,
    )
    const mode = !result.reuse
      ? 'suíte completa'
      : result.kind === 'attestation'
        ? 'reutilizar validação local'
        : 'reutilizar PR aprovado'
    summary(
      `### Plano de validação\n\n- Modo: ${mode}\n- Motivo: ${result.reason}\n- Conteúdo Git: \`${tree}\`\n${result.sourceRun ? `- PR: #${result.pullRequest}; execução: ${result.sourceRun}\n` : ''}${result.attestedBy ? `- Validado localmente por: \`${inline(result.attestedBy)}\`\n` : ''}`,
      env,
    )
    // Auditoria: quem entrou sem validação local aprovada fica registrado na execução do CI.
    const audited =
      env.GITHUB_EVENT_NAME === 'pull_request'
        ? payload.pull_request?.base?.ref === 'dev' && payload.pull_request?.head?.sha
        : env.GITHUB_EVENT_NAME === 'push' && env.GITHUB_REF === 'refs/heads/dev' && env.GITHUB_SHA
    if (!result.reuse && audited) {
      const found = await attestationFor(audited)
      const actor = env.GITHUB_ACTOR ?? 'desconhecido'
      const text =
        found?.kind === 'skipped'
          ? `Validação local PULADA por ${found.user} <${found.email}>: ${found.reason}${found.forced ? ' (push forçado)' : ''}. Suíte completa executada.`
          : found?.scope === 'full'
            ? `A validação local completa de ${found.user} <${found.email}> não corresponde ao conteúdo enviado. Suíte completa executada.`
            : found
              ? `Validação local rápida de ${found.user} <${found.email}> (typecheck, lint e unit). A suíte completa, com E2E, roda no CI; \`npm run validate:local\` antes do push a dispensa.`
              : `Sem validação local registrada para ${audited} (enviado por ${actor}; hooks ignorados ou --no-verify). Suíte completa executada.`
      // Só skip e ausência são alerta; a validação rápida é o fluxo normal e vai apenas ao resumo.
      if (!found || found.kind === 'skipped')
        console.log(`::warning title=Validação local ausente::${escapeCommand(text)}`)
      summary(`### Auditoria de validação local\n\n- ${inline(text)}\n`, env)
    }
    return result
  }
  if (mode === 'record') {
    const payload = event(env)
    if (
      env.GITHUB_EVENT_NAME !== 'pull_request' ||
      payload.pull_request?.base?.ref !== 'dev' ||
      env.GITHUB_REF !== `refs/pull/${payload.number}/merge`
    )
      throw new Error('PR_TO_DEV_REQUIRED')
    // Evidence lives outside the checkout; ignored build/test outputs do not alter source identity.
    if (git('status', '--porcelain', '--untracked-files=normal'))
      throw new Error('TESTED_CHECKOUT_NOT_CLEAN')
    const attempt = Number(env.GITHUB_RUN_ATTEMPT)
    const name = evidenceName({ number: payload.number, job, tree, attempt })
    if (!env.RUNNER_TEMP) throw new Error('RUNNER_TEMP_REQUIRED')
    const path = join(env.RUNNER_TEMP, `ci-validation-${job}.json`)
    writeFileSync(
      path,
      JSON.stringify(
        {
          version: 1,
          repository: env.GITHUB_REPOSITORY,
          pullRequest: payload.number,
          job,
          tree,
          commit: env.GITHUB_SHA,
          runId: env.GITHUB_RUN_ID,
          attempt,
        },
        null,
        2,
      ) + '\n',
    )
    output({ artifact_name: name, artifact_path: path }, env)
    return { tree, name }
  }
  if (mode === 'gate') {
    const result = validateGate({
      planResult: env.CI_PLAN_RESULT,
      reuse: env.CI_REUSE,
      kind: env.CI_REUSE_KIND,
      qualityResult: env.CI_QUALITY_RESULT,
      e2eResult: env.CI_E2E_RESULT,
      eventName: env.GITHUB_EVENT_NAME,
      ref: env.GITHUB_REF,
      sourceRun: env.CI_SOURCE_RUN,
      tree: env.CI_TREE,
      actualTree: tree,
    })
    output({ validated: 'true' }, env)
    summary(
      `### Validação aprovada\n\n- Modo: ${result}\n- Conteúdo Git: \`${tree}\`\n${result === 'reused' ? `- Execução aprovada do PR: ${env.CI_SOURCE_RUN}\n` : result === 'attested' ? '- Validação local aprovada (pre-push) para este conteúdo.\n' : '- Quality e E2E completos aprovados nesta execução.\n'}`,
      env,
    )
    return result
  }
  throw new Error('UNKNOWN_VALIDATION_MODE')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli(process.argv[2], process.env, process.argv[3]).catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
