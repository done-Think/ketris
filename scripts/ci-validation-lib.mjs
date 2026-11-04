const shaPattern = /^[a-f0-9]{40}$/
const requiredJobs = ['quality', 'auth-e2e']
export const evidenceMaxAgeMs = 24 * 60 * 60 * 1000
export const protectedCiPaths = [
  '.github',
  'scripts/ci-validation.mjs',
  'scripts/ci-validation-lib.mjs',
  'scripts/tests/ci-validation.test.mjs',
]

export function isCommitSha(value) {
  return typeof value === 'string' && shaPattern.test(value)
}
function isId(value) {
  return Number.isSafeInteger(value) && value > 0
}
function sameRepository(value, repository) {
  return typeof value === 'string' && value.toLowerCase() === repository.toLowerCase()
}
export function evidenceName({ number, job, tree, attempt }) {
  if (!isId(number) || !requiredJobs.includes(job) || !isCommitSha(tree) || !isId(attempt))
    throw new Error('INVALID_EVIDENCE_IDENTITY')
  return `ci-tested-v1-pr-${number}-${job}-${tree}-attempt-${attempt}`
}

function full(reason) {
  return { reuse: false, reason }
}
function currentRun(runs) {
  return [...runs].filter((run) => isId(run.id)).sort((a, b) => b.id - a.id)[0]
}
function successfulJob(jobs, name, run) {
  const matches = jobs.filter((job) => job.name === name)
  return (
    matches.length === 1 &&
    matches[0].run_id === run.id &&
    (matches[0].run_attempt === undefined || matches[0].run_attempt === run.run_attempt) &&
    matches[0].status === 'completed' &&
    matches[0].conclusion === 'success'
  )
}
function validArtifact(artifact, { run, repositoryId, number, job, tree, now }) {
  const created = Date.parse(artifact.created_at)
  const expires = Date.parse(artifact.expires_at)
  return (
    artifact.name === evidenceName({ number, job, tree, attempt: run.run_attempt }) &&
    artifact.expired === false &&
    artifact.size_in_bytes > 0 &&
    artifact.size_in_bytes < 16_384 &&
    /^sha256:[a-f0-9]{64}$/.test(artifact.digest ?? '') &&
    artifact.workflow_run?.id === run.id &&
    artifact.workflow_run?.repository_id === repositoryId &&
    artifact.workflow_run?.head_repository_id === repositoryId &&
    artifact.workflow_run?.head_sha === run.head_sha &&
    Number.isFinite(created) &&
    now >= created &&
    now - created <= evidenceMaxAgeMs &&
    expires > now
  )
}

// Only evidence from the actual merged PR is eligible. Every uncertainty runs full CI.
export async function planValidation(context, api) {
  const {
    eventName,
    ref,
    repository,
    sha,
    tree,
    before,
    parent,
    policyChanged,
    forced,
    now = Date.now(),
  } = context
  if (eventName !== 'push' || ref !== 'refs/heads/dev') return full('FULL_CI_FOR_EVENT')
  if (
    !isCommitSha(sha) ||
    !isCommitSha(tree) ||
    !isCommitSha(before) ||
    before === '0'.repeat(40) ||
    before !== parent ||
    forced !== false
  )
    return full('DIRECT_OR_NON_LINEAR_PUSH')
  if (policyChanged !== false) return full('CI_POLICY_CHANGED_OR_UNAVAILABLE')
  try {
    const associated = await api.pullsForCommit(sha)
    const candidates = associated.filter(
      (pr) => pr.merge_commit_sha === sha && pr.merged_at && pr.base?.ref === 'dev',
    )
    if (candidates.length !== 1 || !isId(candidates[0].number)) return full('NO_UNIQUE_MERGED_PR')
    const pr = await api.pull(candidates[0].number)
    if (
      pr.number !== candidates[0].number ||
      pr.merged !== true ||
      pr.state !== 'closed' ||
      pr.merge_commit_sha !== sha ||
      pr.base?.ref !== 'dev' ||
      !sameRepository(pr.base?.repo?.full_name, repository) ||
      !sameRepository(pr.head?.repo?.full_name, repository) ||
      !isCommitSha(pr.head?.sha)
    )
      return full('UNTRUSTED_PR_SOURCE')
    const workflow = await api.workflow()
    if (
      !isId(workflow.id) ||
      workflow.path !== '.github/workflows/ci.yml' ||
      workflow.state !== 'active'
    )
      return full('UNEXPECTED_WORKFLOW')
    const run = currentRun(await api.runs(pr.head.sha))
    if (
      !run ||
      run.workflow_id !== workflow.id ||
      run.event !== 'pull_request' ||
      run.status !== 'completed' ||
      run.conclusion !== 'success' ||
      run.head_sha !== pr.head.sha ||
      !isId(run.run_attempt) ||
      !isId(run.repository?.id) ||
      !sameRepository(run.repository?.full_name, repository) ||
      !sameRepository(run.head_repository?.full_name, repository) ||
      run.head_repository?.id !== run.repository.id ||
      ![workflow.path, `${workflow.path}@refs/pull/${pr.number}/merge`].includes(run.path)
    )
      return full('NO_SUCCESSFUL_LATEST_PR_RUN')
    const jobs = await api.jobs(run.id, run.run_attempt)
    if (!requiredJobs.every((name) => successfulJob(jobs, name, run)))
      return full('REQUIRED_JOBS_NOT_SUCCESSFUL')
    const artifacts = await api.artifacts(run.id)
    const identity = {
      run,
      number: pr.number,
      tree,
      now,
      repositoryId: run.repository.id,
    }
    if (
      !requiredJobs.every(
        (job) =>
          artifacts.filter((artifact) => validArtifact(artifact, { ...identity, job })).length ===
          1,
      )
    )
      return full('TESTED_TREE_NOT_PROVEN')
    return {
      reuse: true,
      reason: 'MATCHING_TESTED_PR_TREE',
      sourceRun: run.id,
      pullRequest: pr.number,
    }
  } catch {
    return full('GITHUB_EVIDENCE_UNAVAILABLE')
  }
}

export function validateGate({
  planResult,
  reuse,
  qualityResult,
  e2eResult,
  eventName,
  ref,
  sourceRun,
  tree,
  actualTree,
}) {
  if (planResult !== 'success' || !isCommitSha(tree) || tree !== actualTree)
    throw new Error('VALIDATION_PLAN_NOT_PROVEN')
  if (reuse === 'true') {
    if (
      eventName !== 'push' ||
      ref !== 'refs/heads/dev' ||
      !isId(Number(sourceRun)) ||
      qualityResult !== 'skipped' ||
      e2eResult !== 'skipped'
    )
      throw new Error('INVALID_REUSED_VALIDATION')
    return 'reused'
  }
  if (reuse !== 'false' || qualityResult !== 'success' || e2eResult !== 'success')
    throw new Error('FULL_CI_NOT_SUCCESSFUL')
  return 'full'
}

export function createGithubApi({ repository, token, fetchImpl = fetch }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '') || !token)
    throw new Error('GITHUB_READ_ACCESS_UNAVAILABLE')
  const root = `https://api.github.com/repos/${repository}`
  async function get(path, query = {}) {
    const url = new URL(root + path)
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value))
    const response = await fetchImpl(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ketris-ci-validation',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    })
    if (!response.ok) throw new Error(`GITHUB_API_${response.status}`)
    return response.json()
  }
  async function pages(path, key, query = {}) {
    const items = []
    for (let page = 1; page <= 3; page++) {
      const data = await get(path, { ...query, per_page: 100, page })
      const batch = key ? data[key] : data
      if (!Array.isArray(batch)) throw new Error('INVALID_GITHUB_PAGE')
      items.push(...batch)
      if (batch.length < 100) return items
    }
    throw new Error('GITHUB_PAGINATION_LIMIT')
  }
  return {
    pullsForCommit: (sha) => pages(`/commits/${sha}/pulls`),
    pull: (number) => get(`/pulls/${number}`),
    workflow: () => get('/actions/workflows/ci.yml'),
    runs: (sha) =>
      pages('/actions/workflows/ci.yml/runs', 'workflow_runs', {
        event: 'pull_request',
        head_sha: sha,
      }),
    jobs: (id, attempt) => pages(`/actions/runs/${id}/attempts/${attempt}/jobs`, 'jobs'),
    artifacts: (id) => pages(`/actions/runs/${id}/artifacts`, 'artifacts'),
  }
}
