import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const script = new URL('../face-check-analysis.mjs', import.meta.url).href
const secret = 'analysis-worker-test-secret-at-least-32-bytes'
function execute(configuration = {}, mock = '') {
  return spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    globalThis.fetch = async () => { throw new Error('Unexpected network request') };
    ${mock}
    await import(${JSON.stringify(script)});
  `,
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        FACE_CHECK_APP_ORIGIN: 'https://staging.example.test',
        FACE_CHECK_RETENTION_SECRET: secret,
        ...configuration,
      },
    },
  )
}
test('analysis scheduler refuses unsafe destinations and missing credentials', () => {
  for (const origin of [
    'http://app.test',
    'https://user:pass@app.test',
    'https://app.test/path',
    'https://app.test/?secret=value',
  ]) {
    const result = execute({ FACE_CHECK_APP_ORIGIN: origin })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /HTTPS application origin/)
  }
  assert.notEqual(execute({ FACE_CHECK_RETENTION_SECRET: '' }).status, 0)
})
test('analysis scheduler sends Bearer only to the configured endpoint and reports counts', () => {
  const result = execute(
    {},
    `
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), 'https://staging.example.test/api/internal/face_check/analysis');
      assert.equal(init.headers.Authorization, ${JSON.stringify(`Bearer ${secret}`)});
      assert.equal(init.redirect, 'error');
      return Response.json({processed: 2, failed: 0});
    };
  `,
  )
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /2 session\(s\) resumed/)
  assert.ok(!result.stdout.includes(secret))
})
test('analysis scheduler fails visibly for incomplete or malformed results', () => {
  for (const payload of [
    { processed: 0, failed: 1 },
    { processed: '1', failed: 0 },
    { processed: -1, failed: 0 },
  ]) {
    const result = execute(
      {},
      `globalThis.fetch = async () => Response.json(${JSON.stringify(payload)});`,
    )
    assert.notEqual(result.status, 0)
  }
})
