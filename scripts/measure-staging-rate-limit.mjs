import { performance } from 'node:perf_hooks'

const samples = Number(process.argv[2] ?? 20)
if (!Number.isInteger(samples) || samples < 5 || samples > 60)
  throw new Error('Use between 5 and 60 sequential samples.')

const durations = []
const counterDurations = []
const releases = new Set()
for (let index = 0; index < samples; index += 1) {
  const startedAt = performance.now()
  const response = await fetch('https://ketris-web-x9bk.vercel.app/api/auth/session', {
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  })
  await response.arrayBuffer()
  if (response.status !== 200)
    throw new Error(`Staging returned HTTP ${response.status}; stopping.`)
  durations.push(performance.now() - startedAt)
  releases.add(response.headers.get('x-ketris-release-sha'))
  const match = /(?:^|,)\s*rate-limit;dur=([\d.]+)/.exec(
    response.headers.get('server-timing') ?? '',
  )
  if (match) counterDurations.push(Number(match[1]))
  if (index + 1 < samples) await new Promise((resolve) => setTimeout(resolve, 500))
}
function summarize(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const percentile = (p) => Number(sorted[Math.ceil(p * sorted.length) - 1].toFixed(2))
  return {
    samples: values.length,
    p50Ms: percentile(0.5),
    p95Ms: percentile(0.95),
    maxMs: percentile(1),
  }
}
console.log(
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      releases: [...releases],
      endpoint: '/api/auth/session',
      concurrency: 1,
      http: summarize(durations),
      counter: summarize(counterDurations),
    },
    null,
    2,
  ),
)
