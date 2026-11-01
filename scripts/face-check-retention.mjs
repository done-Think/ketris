import { readFile } from 'node:fs/promises'

const mode = process.argv[2] ?? 'cleanup'
if (mode === 'dispatch') {
  const repository = process.env.GITHUB_REPOSITORY
  const token = process.env.GITHUB_TOKEN
  if (!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository) || !token) {
    throw new Error('GitHub workflow context is required.')
  }
  const response = await fetch(
    `https://api.github.com/repos/${repository}/actions/workflows/face-check-retention.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'dev' }),
      signal: AbortSignal.timeout(30_000),
    },
  )
  if (!response.ok) throw new Error(`Retention dispatch failed (${response.status}).`)
  console.info('Retention check dispatched to dev.')
} else if (mode === 'cleanup') {
  const manifest = JSON.parse(
    await readFile(new URL('../infra/deploy/staging.json', import.meta.url), 'utf8'),
  )
  const origin = new URL(process.env.FACE_CHECK_APP_ORIGIN ?? manifest.origin)
  if (
    origin.protocol !== 'https:' ||
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash
  ) {
    throw new Error('An HTTPS application origin is required.')
  }
  const secret = process.env.FACE_CHECK_RETENTION_SECRET
  if (!secret || Buffer.byteLength(secret) < 32)
    throw new Error('FACE_CHECK_RETENTION_SECRET is required.')
  const response = await fetch(new URL('/api/internal/face_check/cleanup', origin), {
    headers: { Authorization: `Bearer ${secret}` },
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(290_000),
  })
  if (!response.ok) throw new Error(`Retention cleanup failed (${response.status}).`)
  const result = await response.json()
  if (
    !Number.isSafeInteger(result.deleted) ||
    result.deleted < 0 ||
    !Number.isSafeInteger(result.failed) ||
    result.failed !== 0
  ) {
    throw new Error('Retention cleanup did not confirm complete deletion.')
  }
  console.info(`Face Check retention: ${result.deleted} session(s) cleared.`)
} else {
  throw new Error('Unknown retention operation.')
}
