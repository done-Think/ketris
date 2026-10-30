import test from 'node:test'
import assert from 'node:assert/strict'
import { exploreStagingRateLimit } from '../explore-staging-rate-limit.mjs'

const origin = 'https://ketris-web-x9bk.vercel.app'
const sha = 'a'.repeat(40)
const options = { origin, apiVersion: '3', wait: async () => {} }
function response(headers = {}, status = 200) {
  return new Response('{}', {
    status,
    headers: {
      'X-Ketris-Release-Sha': sha,
      'X-Ketris-Api-Version': '3',
      'Server-Timing': 'rate-limit;dur=12.5',
      'RateLimit-Limit': '300',
      'RateLimit-Remaining': '250',
      ...headers,
    },
  })
}

test('bounds traffic to 35 anonymous GETs and observes concurrency 1, 2 and 5', async () => {
  const calls = []
  const report = await exploreStagingRateLimit({
    ...options,
    fetcher: async (url, init) => {
      calls.push({ url, init })
      await new Promise((resolve) => setImmediate(resolve))
      return response()
    },
  })
  assert.equal(calls.length, 35)
  assert.equal(report.status, 'completed')
  assert.equal(report.release, sha)
  assert.equal(report.capacityDecision, 'not_evaluated')
  assert.equal(report.instanceCoverage, 'unverified')
  assert.equal(report.coldStartCoverage, 'unverified')
  assert.deepEqual(
    report.phases.map((phase) => phase.peakInFlight),
    [1, 1, 2, 5],
  )
  assert.deepEqual(
    report.phases.map((phase) => phase.observed),
    [5, 10, 10, 10],
  )
  for (const { url, init } of calls) {
    assert.equal(url.origin, origin)
    assert.ok(['/api/auth/session', '/api/marketplace/stats'].includes(url.pathname))
    assert.equal(init.method, 'GET')
    assert.equal(init.credentials, 'omit')
    assert.equal(init.redirect, 'error')
    assert.deepEqual(init.headers, { 'X-Ketris-Api-Version': '3' })
  }
  for (const phase of report.phases) {
    assert.equal(phase.counter.p95Ms, 12.5)
    assert.equal(phase.minimumRemaining, 250)
    assert.equal(
      phase.byEndpoint.reduce((sum, row) => sum + (row.http?.samples ?? 0), 0),
      phase.observed,
    )
  }
})

test('rejects another origin, credentials, path or version before any request', async () => {
  let calls = 0
  const fetcher = async () => {
    calls++
    return response()
  }
  for (const changes of [
    { origin: 'https://other.example.test' },
    { origin: 'http://ketris-web-x9bk.vercel.app' },
    { origin: 'https://user:private-password@ketris-web-x9bk.vercel.app' },
    { origin: `${origin}/other` },
    { origin: `${origin}?token=private-token` },
    { origin: `${origin}#other` },
    { origin: 'private-password' },
    { apiVersion: '' },
    { apiVersion: 3 },
    { apiVersion: '3.0.0' },
  ])
    await assert.rejects(
      exploreStagingRateLimit({ ...options, ...changes, fetcher }),
      (error) =>
        /WRONG_STAGING_ORIGIN|INVALID_API_VERSION/.test(error.message) &&
        !error.message.includes('private'),
    )
  assert.equal(calls, 0)
})

test('stops without retrying HTTP errors or consuming the quota reserve', async () => {
  for (const [result, reason] of [
    [response({}, 429), 'HTTP_429'],
    [response({}, 503), 'HTTP_503'],
    [response({ 'RateLimit-Remaining': '59' }), 'QUOTA_RESERVE_REACHED'],
  ]) {
    let calls = 0
    const report = await exploreStagingRateLimit({
      ...options,
      fetcher: async () => {
        calls++
        return result
      },
    })
    assert.equal(report.status, 'stopped')
    assert.equal(report.stopReason, reason)
    assert.equal(calls, 1)
  }
})

test('refuses missing telemetry, invalid quotas or a version mismatch', async () => {
  for (const [headers, reason] of [
    [{ 'X-Ketris-Release-Sha': '' }, 'MISSING_RELEASE_SHA'],
    [{ 'Server-Timing': '' }, 'MISSING_COUNTER_TIMING'],
    [{ 'Server-Timing': 'rate-limit;dur=2..5' }, 'MISSING_COUNTER_TIMING'],
    [{ 'RateLimit-Limit': '' }, 'INVALID_QUOTA_HEADERS'],
    [{ 'RateLimit-Remaining': '' }, 'INVALID_QUOTA_HEADERS'],
    [{ 'RateLimit-Remaining': '301' }, 'INVALID_QUOTA_HEADERS'],
    [{ 'RateLimit-Remaining': '-1' }, 'INVALID_QUOTA_HEADERS'],
    [{ 'RateLimit-Remaining': '1.5' }, 'INVALID_QUOTA_HEADERS'],
    [{ 'X-Ketris-Api-Version': '2' }, 'WRONG_API_VERSION'],
  ]) {
    const report = await exploreStagingRateLimit({
      ...options,
      fetcher: async () => response(headers),
    })
    assert.equal(report.status, 'stopped')
    assert.equal(report.stopReason, reason)
  }
})

test('does not mix measurements from different releases', async () => {
  let calls = 0
  const report = await exploreStagingRateLimit({
    ...options,
    fetcher: async () => response({ 'X-Ketris-Release-Sha': ++calls === 1 ? sha : 'b'.repeat(40) }),
  })
  assert.equal(report.stopReason, 'RELEASE_CHANGED')
  assert.equal(calls, 2)
})

test('cancels a failed concurrent wave and never starts another one', async () => {
  let calls = 0
  const report = await exploreStagingRateLimit({
    ...options,
    fetcher: async (_url, init) => {
      const index = ++calls
      if (index < 26) return response()
      if (index === 26) return response({}, 503)
      return new Promise((_resolve, reject) =>
        init.signal.addEventListener('abort', () => reject(new Error('private-detail')), {
          once: true,
        }),
      )
    },
  })
  assert.equal(report.stopReason, 'HTTP_503')
  assert.equal(calls, 30)
  assert.equal(report.attempts, 30)
})

test('does not expose transport errors or upstream details', async () => {
  const report = await exploreStagingRateLimit({
    ...options,
    fetcher: async () => {
      throw new Error('private-password')
    },
  })
  assert.equal(report.stopReason, 'PROBE_TRANSPORT_FAILED')
  assert.equal(report.attempts, 1)
  assert.ok(!JSON.stringify(report).includes('private-password'))
})
