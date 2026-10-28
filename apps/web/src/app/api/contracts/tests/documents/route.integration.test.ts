import { createHash } from 'node:crypto'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import { startPrivateS3Server } from '@server/shared/tests/fixtures/private-s3-server'
import {
  contractRequest,
  createContractWorkflowFixture,
  cleanupContractWorkflowFixture,
} from '@server/contracts/tests/fixtures/workflow-database'
import { POST as init } from '../../[id]/documents/uploads/route'
import { POST as confirm } from '../../[id]/documents/route'
import { GET as download } from '../../[id]/documents/[documentId]/download/route'
import { PATCH } from '../../[id]/route'
import { POST as link } from '../../[id]/parties/[partyId]/link-user/route'

let storage: Awaited<ReturnType<typeof startPrivateS3Server>>
let fixture: Awaited<ReturnType<typeof createContractWorkflowFixture>>
const bytes = Buffer.from('%PDF-1.7\nArquivo exclusivo para teste de integração.\n%%EOF')
const metadata = {
  name: 'Contrato final.pdf',
  size: bytes.length,
  sha256: createHash('sha256').update(bytes).digest('hex'),
}
beforeAll(async () => {
  storage = await startPrivateS3Server()
  vi.stubEnv('AWS_REGION', 'us-east-1')
  vi.stubEnv('AWS_ACCESS_KEY_ID', 'contracts-local-integration-only')
  vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'contracts-local-integration-only')
  vi.stubEnv('AWS_IGNORE_CONFIGURED_ENDPOINT_URLS', 'false')
  vi.stubEnv('AWS_ENDPOINT_URL_S3', storage.url)
  vi.stubEnv('S3_BUCKET_NAME', 'contracts-private-integration')
})
afterAll(async () => {
  await storage?.close()
  vi.unstubAllEnvs()
})
beforeEach(async () => {
  fixture = await createContractWorkflowFixture()
})
afterEach(async () => {
  if (fixture) await cleanupContractWorkflowFixture(fixture.tenantId)
})
function context() {
  return { params: Promise.resolve({ id: fixture.contractId }) }
}
function request(token: string, suffix: string, method = 'GET', body?: unknown) {
  return contractRequest(token, '/' + fixture.contractId + suffix, method, body)
}
async function upload() {
  const response = await init(
    request(fixture.ownerToken, '/documents/uploads', 'POST', metadata),
    context(),
  )
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  const authorization = await response.json()
  expect(new URL(authorization.uploadUrl).origin).toBe(storage.url)
  const uploaded = await fetch(authorization.uploadUrl, {
    method: 'PUT',
    headers: authorization.headers,
    body: bytes,
  })
  expect(uploaded.status).toBe(200)
  return authorization
}
async function finalize(uploadToken: string, token = fixture.ownerToken) {
  return confirm(request(token, '/documents', 'POST', { uploadToken }), context())
}

it('envia diretamente ao storage privado, confirma uma vez e baixa após autorizar o contrato', async () => {
  const authorization = await upload()
  const responses = await Promise.all([
    finalize(authorization.uploadToken),
    finalize(authorization.uploadToken),
  ])
  expect(responses.map((response) => response.status)).toEqual([200, 200])
  const body = await responses[0].json()
  const other = await responses[1].json()
  expect(body.document.id).toBe(other.document.id)
  expect(body.document).toMatchObject({
    sha256: metadata.sha256,
    size: bytes.length,
    contractRevision: 0,
    canDownload: true,
    url: null,
    uploadedBy: { id: fixture.actorId },
  })
  expect(body.document).not.toHaveProperty('objectKey')
  expect(await prisma.contractDocument.count({ where: { contractId: fixture.contractId } })).toBe(1)
  expect(
    await prisma.contractAuditEvent.count({
      where: { contractId: fixture.contractId, action: 'DOCUMENT_UPLOADED' },
    }),
  ).toBe(1)
  const downloadContext = {
    params: Promise.resolve({ id: fixture.contractId, documentId: body.document.id }),
  }
  const response = await download(
    request(fixture.ownerToken, '/documents/' + body.document.id + '/download'),
    downloadContext,
  )
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  const { url } = await response.json()
  expect(new URL(url).origin).toBe(storage.url)
  expect(Buffer.from(await (await fetch(url)).arrayBuffer())).toEqual(bytes)
  expect(storage.requests.filter((entry) => entry.method === 'GET' && entry.range)).toEqual(
    expect.arrayContaining([expect.objectContaining({ range: 'bytes=0-4' })]),
  )
})

it('recusa falta de envio, metadados falsos, arquivo não PDF e campos arbitrários', async () => {
  expect(
    (
      await init(
        request(fixture.ownerToken, '/documents/uploads', 'POST', {
          ...metadata,
          size: 10 * 1024 * 1024 + 1,
        }),
        context(),
      )
    ).status,
  ).toBe(400)
  expect(
    (
      await init(
        request(fixture.ownerToken, '/documents/uploads', 'POST', {
          ...metadata,
          objectKey: 'foreign',
        }),
        context(),
      )
    ).status,
  ).toBe(400)
  const response = await init(
    request(fixture.ownerToken, '/documents/uploads', 'POST', metadata),
    context(),
  )
  const authorization = await response.json()
  expect((await finalize(authorization.uploadToken)).status).toBe(404)
  const nonPdf = Buffer.from('<html>Arquivo inválido</html>')
  const invalidMetadata = {
    ...metadata,
    size: nonPdf.length,
    sha256: createHash('sha256').update(nonPdf).digest('hex'),
  }
  const second = await (
    await init(
      request(fixture.ownerToken, '/documents/uploads', 'POST', invalidMetadata),
      context(),
    )
  ).json()
  expect(
    (await fetch(second.uploadUrl, { method: 'PUT', headers: second.headers, body: nonPdf }))
      .status,
  ).toBe(200)
  expect((await finalize(second.uploadToken)).status).toBe(400)
  expect(await prisma.contractDocument.count({ where: { contractId: fixture.contractId } })).toBe(0)
})

it('revalida revisão após upload sem atribuir arquivo antigo aos dados editados', async () => {
  const authorization = await upload()
  const edited = await PATCH(
    request(fixture.ownerToken, '', 'PATCH', { ...fixture.editBody, amount: 1800.25 }),
    context(),
  )
  expect(edited.status).toBe(200)
  expect((await finalize(authorization.uploadToken)).status).toBe(409)
  expect(await prisma.contractDocument.count({ where: { contractId: fixture.contractId } })).toBe(0)
})

it('recusa outro responsável e permite download ao locatário somente após vínculo explícito', async () => {
  expect(
    (await init(request(fixture.agentToken, '/documents/uploads', 'POST', metadata), context()))
      .status,
  ).toBe(404)
  expect(
    (await init(request(fixture.renterToken, '/documents/uploads', 'POST', metadata), context()))
      .status,
  ).toBe(403)
  const authorization = await upload()
  expect((await finalize(authorization.uploadToken, fixture.agentToken)).status).toBe(403)
  const body = await (await finalize(authorization.uploadToken)).json()
  const downloadContext = {
    params: Promise.resolve({ id: fixture.contractId, documentId: body.document.id }),
  }
  const downloadRequest = () =>
    download(
      request(fixture.renterToken, '/documents/' + body.document.id + '/download'),
      downloadContext,
    )
  expect((await downloadRequest()).status).toBe(404)
  const linked = await link(
    request(fixture.ownerToken, '/parties/' + fixture.tenantPartyId + '/link-user', 'POST', {
      email: fixture.editBody.tenant.email,
    }),
    { params: Promise.resolve({ id: fixture.contractId, partyId: fixture.tenantPartyId }) },
  )
  expect(linked.status).toBe(200)
  expect((await downloadRequest()).status).toBe(200)
  const key = new URL(authorization.uploadUrl).pathname
  const object = storage.objects.get(key)
  expect(object).toBeDefined()
  if (object) storage.objects.set(key, { ...object, bytes: Buffer.from('%PDF-Alterado') })
  expect((await downloadRequest()).status).toBe(400)
})
