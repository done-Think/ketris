import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(
    new URL("../infra/deploy/staging.json", import.meta.url),
    "utf8",
  ),
);
const origin = new URL(process.env.FACE_CHECK_APP_ORIGIN ?? manifest.origin);
if (
  origin.protocol !== "https:" ||
  origin.username ||
  origin.password ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash
)
  throw new Error("An HTTPS application origin is required.");
const secret = process.env.FACE_CHECK_RETENTION_SECRET;
if (!secret || Buffer.byteLength(secret) < 32)
  throw new Error("FACE_CHECK_RETENTION_SECRET is required.");
const response = await fetch(
  new URL("/api/internal/face_check/invitations", origin),
  {
    headers: { Authorization: `Bearer ${secret}` },
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(55000),
  },
);
if (!response.ok)
  throw new Error(`Invitation email processing failed (${response.status}).`);
const result = await response.json();
if (
  ![result.sent, result.failed, result.cancelled].every(
    (value) => Number.isSafeInteger(value) && value >= 0,
  ) ||
  result.failed !== 0
)
  throw new Error("Invitation email processing did not confirm success.");
console.info(
  `Face Check invitations: ${result.sent} accepted by SES, ${result.cancelled} no longer eligible.`,
);
