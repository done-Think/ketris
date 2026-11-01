import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const script = new URL('../face-check-retention.mjs', import.meta.url).href
const secret = 'test-only-retention-secret-at-least-32-bytes'

function execute(mode, settings = {}, mock = '') {
  return spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    process.argv[2] = ${JSON.stringify(mode)};
    globalThis.fetch = async () => { throw new Error('Unexpected outbound request'); };
    ${mock}
    await import(${JSON.stringify(script)});
  `,
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        FACE_CHECK_RETENTION_SECRET: secret,
        FACE_CHECK_APP_ORIGIN: 'https://staging.example.test',
        GITHUB_REPOSITORY: 'example/ketris',
        GITHUB_TOKEN: 'test-only-github-token',
        ...settings,
      },
    },
  )
}

test('refuses insecure origins and missing secrets without network traffic', () => {
  for (const origin of [
    'http://staging.example.test',
    'https://user:pass@staging.example.test',
    'https://staging.example.test/path',
    'https://staging.example.test/?token=value',
  ]) {
    const result = execute('cleanup', { FACE_CHECK_APP_ORIGIN: origin })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /HTTPS application origin/)
  }
  const result = execute('cleanup', { FACE_CHECK_RETENTION_SECRET: '' })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /FACE_CHECK_RETENTION_SECRET is required/)
})

test('uses a private Bearer, refuses redirects and confirms aggregate counts only', () => {
  const result = execute(
    'cleanup',
    {},
    `
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), 'https://staging.example.test/api/internal/face_check/cleanup');
      assert.equal(init.headers.Authorization, ${JSON.stringify(`Bearer ${secret}`)});
      assert.equal(init.redirect, 'error');
      return Response.json({deleted: 4, failed: 0});
    };
  `,
  )
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /4 session\(s\) cleared/)
  assert.ok(!result.stdout.includes(secret))
})

test('partial failures and invalid counts fail the scheduler visibly', () => {
  for (const body of [
    { deleted: 1, failed: 1 },
    { deleted: -1, failed: 0 },
    { deleted: '1', failed: 0 },
  ]) {
    const result = execute(
      'cleanup',
      {},
      `globalThis.fetch = async () => Response.json(${JSON.stringify(body)});`,
    )
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /did not confirm complete deletion/)
  }
})

test('scheduled dispatch targets dev without sending the retention secret to GitHub', () => {
  const result = execute(
    'dispatch',
    {},
    `
    globalThis.fetch = async (url, init) => {
      assert.equal(url, 'https://api.github.com/repos/example/ketris/actions/workflows/face-check-retention.yml/dispatches');
      assert.deepEqual(JSON.parse(init.body), {ref: 'dev'});
      assert.equal(init.headers.Authorization, 'Bearer test-only-github-token');
      assert.ok(!JSON.stringify(init).includes(${JSON.stringify(secret)}));
      return new Response(null, {status: 204});
    };
  `,
  )
  assert.equal(result.status, 0, result.stderr)
})
