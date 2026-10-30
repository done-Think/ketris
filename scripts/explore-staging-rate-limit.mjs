import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'

const stagingOrigin = 'https://ketris-web-x9bk.vercel.app'
const endpoints = ['/api/auth/session', '/api/marketplace/stats']
const phases = [
  { name: 'warmup', concurrency: 1, samples: 5 },
  { name: 'sequential', concurrency: 1, samples: 10 },
  { name: 'parallel-2', concurrency: 2, samples: 10 },
  { name: 'parallel-5', concurrency: 5, samples: 10 },
]
class ProbeError extends Error {}

function summarize(values) {
  if (!values.length) return null
  const sorted = values.toSorted((a, b) => a - b)
  const percentile = (p) => Number(sorted[Math.ceil(p * sorted.length) - 1].toFixed(2))
  return {
    samples: values.length,
    p50Ms: percentile(0.5),
    p95Ms: percentile(0.95),
    maxMs: percentile(1),
  }
}

export async function exploreStagingRateLimit({
  origin,
  apiVersion,
  fetcher = fetch,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  onPhase = () => {},
}) {
  let url
  try {
    url = new URL(origin)
  } catch {
    throw new ProbeError('WRONG_STAGING_ORIGIN')
  }
  if (
    url.origin !== stagingOrigin ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new ProbeError('WRONG_STAGING_ORIGIN')
  if (typeof apiVersion !== 'string' || !/^[1-9]\d*$/.test(apiVersion))
    throw new ProbeError('INVALID_API_VERSION')

  const controller = new AbortController()
  const results = []
  let release = null
  let attempts = 0
  let failure = null
  for (const phase of phases) {
    const observations = []
    let inFlight = 0
    let peakInFlight = 0
    async function request() {
      const endpoint = endpoints[attempts++ % endpoints.length]
      const startedAt = performance.now()
      peakInFlight = Math.max(peakInFlight, ++inFlight)
      try {
        const response = await fetcher(new URL(endpoint, origin), {
          method: 'GET',
          headers: { 'X-Ketris-Api-Version': apiVersion },
          credentials: 'omit',
          redirect: 'error',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
        })
        if (response.status !== 200) {
          await response.body?.cancel()
          throw new ProbeError(`HTTP_${response.status}`)
        }
        await response.arrayBuffer()
        const sha = response.headers.get('x-ketris-release-sha')
        if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new ProbeError('MISSING_RELEASE_SHA')
        if (release && sha !== release) throw new ProbeError('RELEASE_CHANGED')
        release = sha
        if (
          endpoint !== endpoints[0] &&
          response.headers.get('x-ketris-api-version') !== apiVersion
        )
          throw new ProbeError('WRONG_API_VERSION')
        const timing = /(?:^|,)\s*rate-limit;dur=([\d.]+)/.exec(
          response.headers.get('server-timing') ?? '',
        )
        const counterMs = timing ? Number(timing[1]) : NaN
        if (!Number.isFinite(counterMs) || counterMs < 0)
          throw new ProbeError('MISSING_COUNTER_TIMING')
        const limitHeader = response.headers.get('ratelimit-limit')
        const remainingHeader = response.headers.get('ratelimit-remaining')
        const limit = Number(limitHeader)
        const remaining = Number(remainingHeader)
        if (
          !/^\d+$/.test(limitHeader ?? '') ||
          !/^\d+$/.test(remainingHeader ?? '') ||
          !Number.isSafeInteger(limit) ||
          limit < 1 ||
          !Number.isSafeInteger(remaining) ||
          remaining < 0 ||
          remaining > limit
        )
          throw new ProbeError('INVALID_QUOTA_HEADERS')
        observations.push({ endpoint, httpMs: performance.now() - startedAt, counterMs, remaining })
        if (remaining < 60) throw new ProbeError('QUOTA_RESERVE_REACHED')
      } catch (error) {
        failure ??= error instanceof ProbeError ? error.message : 'PROBE_TRANSPORT_FAILED'
        controller.abort()
      } finally {
        inFlight -= 1
      }
    }
    for (let offset = 0; offset < phase.samples && !failure; offset += phase.concurrency) {
      await Promise.all(
        Array.from({ length: Math.min(phase.concurrency, phase.samples - offset) }, request),
      )
      if (!failure && offset + phase.concurrency < phase.samples) await wait(500)
    }
    const metrics = (rows) => ({
      http: summarize(rows.map((row) => row.httpMs)),
      counter: summarize(rows.map((row) => row.counterMs)),
    })
    results.push({
      ...phase,
      observed: observations.length,
      peakInFlight,
      ...metrics(observations),
      byEndpoint: endpoints.map((endpoint) => ({
        endpoint,
        ...metrics(observations.filter((row) => row.endpoint === endpoint)),
      })),
      minimumRemaining: observations.length
        ? Math.min(...observations.map((row) => row.remaining))
        : null,
    })
    onPhase(phase.name, observations.length)
    if (failure) break
    if (phase !== phases.at(-1)) await wait(2000)
  }
  return {
    measuredAt: new Date().toISOString(),
    status: failure ? 'stopped' : 'completed',
    stopReason: failure,
    origin: stagingOrigin,
    release,
    apiVersion,
    attempts,
    requestBudget: 35,
    minimumQuotaReserve: 60,
    instanceCoverage: 'unverified',
    coldStartCoverage: 'unverified',
    capacityDecision: 'not_evaluated',
    phases: results,
  }
}

async function main() {
  if (process.argv.length !== 2) throw new ProbeError('UNEXPECTED_ARGUMENTS')
  const target = JSON.parse(
    readFileSync(new URL('../infra/deploy/staging.json', import.meta.url), 'utf8'),
  )
  if (target.projectName !== 'ketris-web-x9bk') throw new ProbeError('WRONG_STAGING_PROJECT')
  const openapi = JSON.parse(
    readFileSync(new URL('../apps/web/openapi.json', import.meta.url), 'utf8'),
  )
  const apiVersion = openapi.info?.version?.match(/^([1-9]\d*)\.\d+\.\d+$/)?.[1]
  const result = await exploreStagingRateLimit({
    origin: target.origin,
    apiVersion,
    onPhase: (name, count) => console.error(`${name}: ${count} responses observed`),
  })
  console.log(JSON.stringify(result, null, 2))
  if (result.status !== 'completed') process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof ProbeError ? error.message : 'PROBE_CONFIG_INVALID')
    process.exitCode = 1
  })
}
