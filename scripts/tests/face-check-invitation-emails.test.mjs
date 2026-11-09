import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = new URL("../face-check-invitation-emails.mjs", import.meta.url)
  .href;
const secret = "test-only-invitation-secret-at-least-32-bytes";
function execute(settings = {}, mock = "") {
  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import assert from 'node:assert/strict';
    globalThis.fetch=async()=>{throw new Error('Unexpected network traffic')};
    ${mock}
    await import(${JSON.stringify(script)});
  `,
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        FACE_CHECK_RETENTION_SECRET: secret,
        FACE_CHECK_APP_ORIGIN: "https://staging.example.test",
        ...settings,
      },
    },
  );
}
test("invitation scheduler refuses unsafe origins and absent secrets without sending mail", () => {
  for (const origin of [
    "http://example.test",
    "https://user:pass@example.test",
    "https://example.test/path",
    "https://example.test/?secret=value",
  ]) {
    const result = execute({ FACE_CHECK_APP_ORIGIN: origin });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /HTTPS application origin/);
  }
  assert.notEqual(execute({ FACE_CHECK_RETENTION_SECRET: "" }).status, 0);
});
test("invitation scheduler refuses redirects and reports aggregate counts only", () => {
  const result = execute(
    {},
    `
    globalThis.fetch=async(url,init)=>{
      assert.equal(String(url),'https://staging.example.test/api/internal/face_check/invitations');
      assert.equal(init.headers.Authorization,${JSON.stringify(`Bearer ${secret}`)});
      assert.equal(init.redirect,'error');
      return Response.json({sent:2,failed:0,cancelled:1});
    };
  `,
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /2 accepted by SES/);
  assert.ok(!result.stdout.includes(secret));
});
test("invitation scheduler fails visibly for rejected delivery or malformed counts", () => {
  for (const payload of [
    { sent: 0, failed: 1, cancelled: 0 },
    { sent: "1", failed: 0, cancelled: 0 },
    { sent: 1, failed: 0, cancelled: -1 },
  ]) {
    const result = execute(
      {},
      `globalThis.fetch=async()=>Response.json(${JSON.stringify(payload)});`,
    );
    assert.notEqual(result.status, 0);
  }
});
