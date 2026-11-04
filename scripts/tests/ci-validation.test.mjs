import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  createGithubApi,
  evidenceMaxAgeMs,
  evidenceName,
  planValidation,
  validateGate,
} from '../ci-validation-lib.mjs'
import { runCli } from '../ci-validation.mjs'

const sha = 'a'.repeat(40)
const before = 'b'.repeat(40)
const head = 'c'.repeat(40)
const tree = 'd'.repeat(40)
const now = Date.parse('2026-10-31T12:00:00Z')
const repository = 'done-Think/ketris'

function fixture() {
  const context = {
    eventName: 'push',
    ref: 'refs/heads/dev',
    repository,
    sha,
    tree,
    before,
    parent: before,
    forced: false,
    policyChanged: false,
    now,
  }
  const pr = {
    number: 177,
    state: 'closed',
    merged: true,
    merged_at: '2026-10-31T11:59:00Z',
    merge_commit_sha: sha,
    head: { sha: head, repo: { full_name: repository } },
    base: { ref: 'dev', repo: { full_name: repository } },
  }
  const run = {
    id: 100,
    run_attempt: 1,
    workflow_id: 7,
    path: '.github/workflows/ci.yml',
    event: 'pull_request',
    status: 'completed',
    conclusion: 'success',
    head_sha: head,
    repository: { id: 10, full_name: repository },
    head_repository: { id: 10, full_name: repository },
  }
  const jobs = ['quality', 'auth-e2e'].map((name) => ({
    name,
    run_id: run.id,
    run_attempt: 1,
    status: 'completed',
    conclusion: 'success',
  }))
  const artifacts = jobs.map((job) => ({
    name: evidenceName({ number: pr.number, job: job.name, tree, attempt: 1 }),
    size_in_bytes: 500,
    digest: `sha256:${'f'.repeat(64)}`,
    expired: false,
    created_at: new Date(now - 60_000).toISOString(),
    expires_at: new Date(now + 7 * 86400_000).toISOString(),
    workflow_run: {
      id: run.id,
      repository_id: 10,
      head_repository_id: 10,
      head_sha: head,
    },
  }))
  const workflow = { id: 7, path: '.github/workflows/ci.yml', state: 'active' }
  const runs = [run]
  const data = { pr, run, runs, jobs, artifacts, workflow }
  const api = {
    pullsForCommit: async () => [pr],
    pull: async () => pr,
    workflow: async () => workflow,
    runs: async () => runs,
    jobs: async () => jobs,
    artifacts: async () => artifacts,
  }
  return { context, data, api }
}

test('reuses both passing gates only for the exact tested Git tree and merged PR', async () => {
  const { context, api } = fixture()
  assert.deepEqual(await planValidation(context, api), {
    reuse: true,
    reason: 'MATCHING_TESTED_PR_TREE',
    sourceRun: 100,
    pullRequest: 177,
  })
})

test('supports successful attempts whose jobs API omits run_attempt', async () => {
  const { context, api, data } = fixture()
  for (const job of data.jobs) delete job.run_attempt
  assert.equal((await planValidation(context, api)).reuse, true)
})

for (const [name, changes] of [
  ['PR', { eventName: 'pull_request', ref: 'refs/pull/177/merge' }],
  ['main', { ref: 'refs/heads/main' }],
  ['forced update', { forced: true }],
  ['unknown push origin', { forced: undefined }],
  ['batched or non-linear push', { parent: 'e'.repeat(40) }],
  ['branch creation', { before: '0'.repeat(40) }],
  ['missing history', { parent: undefined }],
  ['changed workflow or verification policy', { policyChanged: true }],
  ['unknown policy state', { policyChanged: undefined }],
])
  test(`${name} always executes full CI without querying evidence`, async () => {
    const { context } = fixture()
    let requests = 0
    const api = new Proxy(
      {},
      {
        get() {
          requests++
          throw new Error('must not request evidence')
        },
      },
    )
    assert.equal((await planValidation({ ...context, ...changes }, api)).reuse, false)
    assert.equal(requests, 0)
  })

test('a direct push with identical files cannot reuse an unrelated merged PR', async () => {
  const { context, api, data } = fixture()
  data.pr.merge_commit_sha = 'e'.repeat(40)
  assert.equal((await planValidation(context, api)).reuse, false)
})

for (const [name, change] of [
  [
    'different source tree',
    (d) => {
      d.artifacts[1].name = evidenceName({
        number: 177,
        job: 'auth-e2e',
        tree: head,
        attempt: 1,
      })
    },
  ],
  [
    'different PR',
    (d) => {
      d.artifacts[0].name = evidenceName({
        number: 178,
        job: 'quality',
        tree,
        attempt: 1,
      })
    },
  ],
  [
    'missing quality proof',
    (d) => {
      d.artifacts.shift()
    },
  ],
  [
    'missing E2E proof',
    (d) => {
      d.artifacts.pop()
    },
  ],
  [
    'expired artifact',
    (d) => {
      d.artifacts[0].expired = true
    },
  ],
  [
    'old validation',
    (d) => {
      d.artifacts[0].created_at = new Date(now - evidenceMaxAgeMs - 1).toISOString()
    },
  ],
  [
    'invalid time',
    (d) => {
      d.artifacts[0].created_at = 'invalid'
    },
  ],
  [
    'future artifact',
    (d) => {
      d.artifacts[0].created_at = new Date(now + 1).toISOString()
    },
  ],
  [
    'missing digest',
    (d) => {
      delete d.artifacts[0].digest
    },
  ],
  [
    'foreign artifact repository',
    (d) => {
      d.artifacts[0].workflow_run.repository_id = 11
    },
  ],
  [
    'foreign artifact run',
    (d) => {
      d.artifacts[0].workflow_run.id = 101
    },
  ],
  [
    'artifact from another head',
    (d) => {
      d.artifacts[0].workflow_run.head_sha = sha
    },
  ],
  [
    'duplicate artifacts',
    (d) => {
      d.artifacts.push(structuredClone(d.artifacts[0]))
    },
  ],
  [
    'skipped quality',
    (d) => {
      d.jobs[0].conclusion = 'skipped'
    },
  ],
  [
    'failed E2E',
    (d) => {
      d.jobs[1].conclusion = 'failure'
    },
  ],
  [
    'incomplete E2E',
    (d) => {
      d.jobs[1].status = 'in_progress'
    },
  ],
  [
    'missing job',
    (d) => {
      d.jobs.pop()
    },
  ],
  [
    'duplicate job',
    (d) => {
      d.jobs.push(structuredClone(d.jobs[0]))
    },
  ],
  [
    'mixed job attempts',
    (d) => {
      d.jobs[1].run_attempt = 2
    },
  ],
  [
    'artifact from previous attempt',
    (d) => {
      d.run.run_attempt = 2
      for (const job of d.jobs) job.run_attempt = 2
    },
  ],
  [
    'failed run',
    (d) => {
      d.run.conclusion = 'failure'
    },
  ],
  [
    'incomplete run',
    (d) => {
      d.run.status = 'in_progress'
    },
  ],
  [
    'unexpected workflow',
    (d) => {
      d.run.workflow_id = 99
    },
  ],
  [
    'unexpected event',
    (d) => {
      d.run.event = 'pull_request_target'
    },
  ],
  [
    'foreign fork run',
    (d) => {
      d.run.head_repository.id = 11
    },
  ],
  [
    'foreign fork PR',
    (d) => {
      d.pr.head.repo.full_name = 'someone/fork'
    },
  ],
  [
    'wrong base branch',
    (d) => {
      d.pr.base.ref = 'main'
    },
  ],
  [
    'inactive workflow',
    (d) => {
      d.workflow.state = 'disabled_manually'
    },
  ],
])
  test(`${name} refuses reuse and falls back to full CI`, async () => {
    const { context, api, data } = fixture()
    change(data)
    assert.equal((await planValidation(context, api)).reuse, false)
  })

test('never selects an older green run when the latest run failed', async () => {
  const { context, api, data } = fixture()
  data.runs.push({
    ...structuredClone(data.run),
    id: 101,
    conclusion: 'failure',
  })
  assert.equal((await planValidation(context, api)).reuse, false)
})
test('metadata/service failures trigger the full suite instead of a release bypass', async () => {
  for (const method of ['pullsForCommit', 'pull', 'workflow', 'runs', 'jobs', 'artifacts']) {
    const { context, api } = fixture()
    api[method] = async () => {
      throw new Error('private-token-must-not-appear')
    }
    assert.deepEqual(await planValidation(context, api), {
      reuse: false,
      reason: 'GITHUB_EVIDENCE_UNAVAILABLE',
    })
  }
})

const fullGate = {
  planResult: 'success',
  reuse: 'false',
  qualityResult: 'success',
  e2eResult: 'success',
  eventName: 'push',
  ref: 'refs/heads/dev',
  tree,
  actualTree: tree,
}
const reusedGate = {
  ...fullGate,
  reuse: 'true',
  qualityResult: 'skipped',
  e2eResult: 'skipped',
  sourceRun: '100',
}
test('the release gate accepts full CI or verified reuse with skipped redundant jobs', () => {
  assert.equal(validateGate(fullGate), 'full')
  assert.equal(validateGate(reusedGate), 'reused')
})
for (const changes of [
  { planResult: 'failure' },
  { actualTree: head },
  { qualityResult: 'skipped' },
  { e2eResult: 'failure' },
  { e2eResult: 'cancelled' },
  { reuse: '' },
])
  test(`the release gate refuses unproven full CI: ${JSON.stringify(changes)}`, () =>
    assert.throws(() => validateGate({ ...fullGate, ...changes })))
for (const changes of [
  { planResult: 'cancelled' },
  { sourceRun: '' },
  { eventName: 'pull_request' },
  { ref: 'refs/heads/main' },
  { qualityResult: 'failure' },
  { e2eResult: 'success' },
])
  test(`the release gate refuses invalid reuse: ${JSON.stringify(changes)}`, () =>
    assert.throws(() => validateGate({ ...reusedGate, ...changes })))

test('the GitHub client scopes requests to the repository, workflow and exact job attempt', async () => {
  const requests = []
  const api = createGithubApi({
    repository,
    token: 'private-token',
    fetchImpl: async (url, options) => {
      requests.push([url, options])
      return new Response(
        JSON.stringify(url.pathname.endsWith('/jobs') ? { jobs: [] } : { workflow_runs: [] }),
      )
    },
  })
  await api.runs(head)
  await api.jobs(100, 2)
  assert.equal(requests[0][0].searchParams.get('head_sha'), head)
  assert.equal(requests[0][0].searchParams.get('event'), 'pull_request')
  assert.equal(requests[1][0].pathname, '/repos/done-Think/ketris/actions/runs/100/attempts/2/jobs')
  assert.equal(requests[0][1].headers.Authorization, 'Bearer private-token')
  assert.equal(requests[0][1].redirect, 'error')
  assert.throws(() =>
    createGithubApi({
      repository: 'https://untrusted.test',
      token: 'private-token',
    }),
  )
})
test('pagination reads all evidence pages and refuses unbounded collections', async () => {
  let pages = 0
  const api = createGithubApi({
    repository,
    token: 'private-token',
    fetchImpl: async () => {
      pages++
      return new Response(
        JSON.stringify({
          artifacts: pages === 1 ? Array(100).fill({}) : [{ name: 'proof' }],
        }),
      )
    },
  })
  assert.equal((await api.artifacts(100)).length, 101)
  assert.equal(pages, 2)
  const endless = createGithubApi({
    repository,
    token: 'private-token',
    fetchImpl: async () => new Response(JSON.stringify({ artifacts: Array(100).fill({}) })),
  })
  await assert.rejects(endless.artifacts(100), /PAGINATION_LIMIT/)
})
test('HTTP errors do not leak response bodies or credentials', async () => {
  const api = createGithubApi({
    repository,
    token: 'private-token',
    fetchImpl: async () => new Response('private-token', { status: 403 }),
  })
  await assert.rejects(api.workflow(), (error) => error.message === 'GITHUB_API_403')
})

function temporaryRepo() {
  const temp = mkdtempSync(join(tmpdir(), 'ketris-ci-proof-'))
  const cwd = join(temp, 'repo')
  const runner = join(temp, 'runner')
  mkdirSync(cwd)
  mkdirSync(runner)
  const git = (...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_GLOBAL: '/dev/null',
      },
    }).trim()
  git('init', '-q')
  git('config', 'user.name', 'CI Test')
  git('config', 'user.email', 'ci@example.test')
  git('config', 'commit.gpgsign', 'false')
  git('config', 'core.hooksPath', join(cwd, '.git/hooks'))
  writeFileSync(join(cwd, 'source.txt'), 'tested source\n')
  git('add', '.')
  git('commit', '-qm', 'initial fixture')
  const commit = git('rev-parse', 'HEAD')
  const eventPath = join(temp, 'event.json')
  writeFileSync(eventPath, JSON.stringify({ number: 177, pull_request: { base: { ref: 'dev' } } }))
  const env = {
    GITHUB_SHA: commit,
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_REF: 'refs/pull/177/merge',
    GITHUB_REPOSITORY: repository,
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_RUN_ATTEMPT: '1',
    GITHUB_RUN_ID: '100',
    GITHUB_OUTPUT: join(temp, 'output.txt'),
    GITHUB_STEP_SUMMARY: join(temp, 'summary.md'),
    RUNNER_TEMP: runner,
  }
  return {
    cwd,
    env,
    temp,
    git,
    dispose: () => rmSync(temp, { recursive: true, force: true }),
  }
}
test('records actual checkout identity without installing packages or copying secrets', async () => {
  const repo = temporaryRepo()
  try {
    const env = { ...repo.env, GITHUB_TOKEN: 'private-token-no-copy' }
    const proof = await runCli('record', env, 'quality', {
      cwd: repo.cwd,
    })
    assert.match(proof.name, new RegExp(repo.git('rev-parse', 'HEAD^{tree}')))
    const savedText = readFileSync(join(repo.env.RUNNER_TEMP, 'ci-validation-quality.json'), 'utf8')
    const saved = JSON.parse(savedText)
    assert.equal(savedText.includes(env.GITHUB_TOKEN), false)
    assert.equal(saved.commit, repo.env.GITHUB_SHA)
    assert.equal(saved.pullRequest, 177)
    assert.equal(saved.job, 'quality')
    assert.match(readFileSync(repo.env.GITHUB_OUTPUT, 'utf8'), /artifact_name=ci-tested-v1/)
    writeFileSync(join(repo.cwd, 'source.txt'), 'untested modification')
    await assert.rejects(
      runCli('record', repo.env, 'quality', { cwd: repo.cwd }),
      /CHECKOUT_NOT_CLEAN/,
    )
  } finally {
    repo.dispose()
  }
})
test('rejects an evidence checkout different from the event SHA', async () => {
  const repo = temporaryRepo()
  try {
    await assert.rejects(
      runCli('record', { ...repo.env, GITHUB_SHA: sha }, 'auth-e2e', {
        cwd: repo.cwd,
      }),
      /CHECKOUT_SHA_MISMATCH/,
    )
  } finally {
    repo.dispose()
  }
})
test('PR planning emits the full suite decision without credentials or network', async () => {
  const repo = temporaryRepo()
  try {
    const result = await runCli('plan', repo.env, undefined, {
      cwd: repo.cwd,
      fetchImpl: () => assert.fail('network must not be used'),
    })
    assert.equal(result.reuse, false)
    assert.equal(result.reason, 'FULL_CI_FOR_EVENT')
    assert.match(readFileSync(repo.env.GITHUB_OUTPUT, 'utf8'), /reuse=false/)
  } finally {
    repo.dispose()
  }
})
test('the CLI gate proves the current checkout and emits validation only on success', async () => {
  const repo = temporaryRepo()
  try {
    const env = {
      ...repo.env,
      CI_PLAN_RESULT: 'success',
      CI_REUSE: 'false',
      CI_TREE: repo.git('rev-parse', 'HEAD^{tree}'),
      CI_QUALITY_RESULT: 'success',
      CI_E2E_RESULT: 'success',
    }
    assert.equal(await runCli('gate', env, undefined, { cwd: repo.cwd }), 'full')
    assert.match(readFileSync(env.GITHUB_OUTPUT, 'utf8'), /validated=true/)
    await assert.rejects(
      runCli('gate', { ...env, CI_E2E_RESULT: 'failure' }, undefined, {
        cwd: repo.cwd,
      }),
      /FULL_CI_NOT_SUCCESSFUL/,
    )
  } finally {
    repo.dispose()
  }
})

test('actual Git checkouts and GitHub metadata connect producer, planner and release gate', async () => {
  const repo = temporaryRepo()
  try {
    const firstCommit = repo.env.GITHUB_SHA
    writeFileSync(join(repo.cwd, 'source.txt'), 'new tested source\n')
    repo.git('add', '.')
    repo.git('commit', '-qm', 'squashed change')
    const commit = repo.git('rev-parse', 'HEAD')
    const actualTree = repo.git('rev-parse', 'HEAD^{tree}')
    const testedMerge = repo.git(
      'commit-tree',
      actualTree,
      '-p',
      firstCommit,
      '-p',
      commit,
      '-m',
      'PR synthetic merge',
    )
    assert.notEqual(testedMerge, commit)
    repo.git('checkout', '--detach', testedMerge)
    const env = {
      ...repo.env,
      GITHUB_SHA: testedMerge,
      GITHUB_TOKEN: 'test-only-read-token',
    }
    const quality = await runCli('record', env, 'quality', { cwd: repo.cwd })
    const e2e = await runCli('record', env, 'auth-e2e', { cwd: repo.cwd })
    repo.git('checkout', '--detach', commit)
    const { data } = fixture()
    data.pr.merge_commit_sha = commit
    data.pr.head.sha = commit
    data.run.head_sha = commit
    data.artifacts[0].name = quality.name
    data.artifacts[1].name = e2e.name
    for (const artifact of data.artifacts) {
      artifact.workflow_run.head_sha = commit
      artifact.created_at = new Date(Date.now() - 1_000).toISOString()
      artifact.expires_at = new Date(Date.now() + 86400_000).toISOString()
    }
    writeFileSync(env.GITHUB_EVENT_PATH, JSON.stringify({ before: firstCommit, forced: false }))
    const pushEnv = {
      ...env,
      GITHUB_SHA: commit,
      GITHUB_EVENT_NAME: 'push',
      GITHUB_REF: 'refs/heads/dev',
    }
    const fetchImpl = async (url) => {
      const path = url.pathname
      const response = path.endsWith('/pulls')
        ? [data.pr]
        : path.endsWith('/pulls/177')
          ? data.pr
          : path.endsWith('/ci.yml/runs')
            ? { workflow_runs: data.runs }
            : path.endsWith('/ci.yml')
              ? data.workflow
              : path.endsWith('/attempts/1/jobs')
                ? { jobs: data.jobs }
                : path.endsWith('/artifacts')
                  ? { artifacts: data.artifacts }
                  : null
      assert.notEqual(response, null, `Unexpected API request: ${path}`)
      return new Response(JSON.stringify(response))
    }
    const result = await runCli('plan', pushEnv, undefined, {
      cwd: repo.cwd,
      fetchImpl,
    })
    assert.equal(result.reuse, true)
    assert.equal(
      await runCli(
        'gate',
        {
          ...pushEnv,
          CI_PLAN_RESULT: 'success',
          CI_REUSE: 'true',
          CI_TREE: actualTree,
          CI_SOURCE_RUN: '100',
          CI_QUALITY_RESULT: 'skipped',
          CI_E2E_RESULT: 'skipped',
        },
        undefined,
        { cwd: repo.cwd },
      ),
      'reused',
    )

    writeFileSync(join(repo.cwd, 'source.txt'), 'untested source\n')
    repo.git('add', '.')
    repo.git('commit', '-qm', 'untested change')
    const untestedCommit = repo.git('rev-parse', 'HEAD')
    data.pr.merge_commit_sha = untestedCommit
    writeFileSync(env.GITHUB_EVENT_PATH, JSON.stringify({ before: commit, forced: false }))
    assert.equal(
      (
        await runCli('plan', { ...pushEnv, GITHUB_SHA: untestedCommit }, undefined, {
          cwd: repo.cwd,
          fetchImpl,
        })
      ).reuse,
      false,
    )
  } finally {
    repo.dispose()
  }
})

test('changes to actual CI policy files force full validation before any GitHub request', async () => {
  const repo = temporaryRepo()
  try {
    const beforeCommit = repo.env.GITHUB_SHA
    mkdirSync(join(repo.cwd, '.github/workflows'), { recursive: true })
    writeFileSync(join(repo.cwd, '.github/workflows/ci.yml'), 'changed policy\n')
    repo.git('add', '.')
    repo.git('commit', '-qm', 'change CI policy')
    writeFileSync(
      repo.env.GITHUB_EVENT_PATH,
      JSON.stringify({ before: beforeCommit, forced: false }),
    )
    const result = await runCli(
      'plan',
      {
        ...repo.env,
        GITHUB_SHA: repo.git('rev-parse', 'HEAD'),
        GITHUB_EVENT_NAME: 'push',
        GITHUB_REF: 'refs/heads/dev',
        GITHUB_TOKEN: 'test-only-read-token',
      },
      undefined,
      {
        cwd: repo.cwd,
        fetchImpl: () => assert.fail('policy change must not query GitHub'),
      },
    )
    assert.deepEqual(result, {
      reuse: false,
      reason: 'CI_POLICY_CHANGED_OR_UNAVAILABLE',
    })
  } finally {
    repo.dispose()
  }
})
