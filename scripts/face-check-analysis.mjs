import { readFile } from 'node:fs/promises'

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
)
  throw new Error('An HTTPS application origin is required.')
const secret = process.env.FACE_CHECK_RETENTION_SECRET
if (!secret || Buffer.byteLength(secret) < 32)
  throw new Error('FACE_CHECK_RETENTION_SECRET is required.')
const response = await fetch(new URL('/api/internal/face_check/analysis', origin), {
  headers: { Authorization: `Bearer ${secret}` },
  redirect: 'error',
  cache: 'no-store',
  signal: AbortSignal.timeout(115_000),
})
if (!response.ok) throw new Error(`Analysis processing failed (${response.status}).`)
const result = await response.json()
if (!Number.isSafeInteger(result.processed) || result.processed < 0 || result.failed !== 0)
  throw new Error('Analysis processing did not confirm success.')
console.info(`Face Check analysis: ${result.processed} session(s) resumed.`)
