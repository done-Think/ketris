// @vitest-environment node
import { S3Client } from '@aws-sdk/client-s3'
import { sdkStreamMixin } from '@smithy/core/serde'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { S3ContractDocumentStorage } from '../../infrastructure/s3-contract-document-storage'
import { documentDescriptor } from '../fixtures/document'

const client = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://127.0.0.1:3102',
  forcePathStyle: true,
  credentials: { accessKeyId: 'local-tests-only', secretAccessKey: 'local-tests-only' },
})
afterEach(() => vi.restoreAllMocks())

describe('storage privado de PDFs de Contracts', () => {
  it('assina envio com tamanho, tipo e checksum obrigatórios, sem ACL pública', async () => {
    const send = vi.spyOn(client, 'send')
    const storage = new S3ContractDocumentStorage(client, 'private-test')
    const result = await storage.uploadLocation(
      'contracts/agency/contract/document.pdf',
      documentDescriptor,
    )
    const url = new URL(result.url)
    expect(url.origin).toBe('http://127.0.0.1:3102')
    expect(url.pathname).toBe('/private-test/contracts/agency/contract/document.pdf')
    expect(url.searchParams.get('X-Amz-Expires')).toBe('600')
    expect(url.searchParams.get('X-Amz-SignedHeaders')?.split(';')).toEqual(
      expect.arrayContaining(['content-length', 'content-type', 'x-amz-checksum-sha256']),
    )
    expect(result.headers).toEqual({
      'Content-Type': 'application/pdf',
      'x-amz-checksum-sha256': Buffer.from(documentDescriptor.sha256, 'hex').toString('base64'),
    })
    expect(result.url).not.toContain('public-read')
    expect(send).not.toHaveBeenCalled()
  })

  it('confere hash e metadados com HEAD e lê somente o cabeçalho do PDF', async () => {
    const send = vi
      .fn<(command: { input: unknown }) => Promise<unknown>>()
      .mockResolvedValueOnce({
        $metadata: {},
        ContentLength: 512,
        ContentType: 'application/pdf',
        ChecksumSHA256: Buffer.from(documentDescriptor.sha256, 'hex').toString('base64'),
      })
      .mockResolvedValueOnce({
        $metadata: {},
        Body: sdkStreamMixin(Readable.from(Buffer.from('%PDF-'))),
      })
    vi.spyOn(client, 'send').mockImplementation(send)
    const info = await new S3ContractDocumentStorage(client, 'private-test').inspect('key')
    expect(info).toEqual({
      size: 512,
      contentType: 'application/pdf',
      sha256: documentDescriptor.sha256,
      pdf: true,
    })
    expect(send.mock.calls[0][0].input).toMatchObject({ Key: 'key', ChecksumMode: 'ENABLED' })
    expect(send.mock.calls[1][0].input).toMatchObject({ Key: 'key', Range: 'bytes=0-4' })
  })

  it('identifica extensão PDF com conteúdo incompatível e erro sem revelar credenciais', async () => {
    const send = vi
      .fn<(command: { input: unknown }) => Promise<unknown>>()
      .mockResolvedValueOnce({ $metadata: {}, ContentLength: 512, ContentType: 'application/pdf' })
      .mockResolvedValueOnce({
        $metadata: {},
        Body: sdkStreamMixin(Readable.from(Buffer.from('html!'))),
      })
    vi.spyOn(client, 'send').mockImplementation(send)
    const storage = new S3ContractDocumentStorage(client, 'private-test')
    expect(await storage.inspect('key')).toMatchObject({ pdf: false, sha256: null })
    send.mockRejectedValueOnce(new Error('secret storage details'))
    await expect(storage.inspect('key')).rejects.toMatchObject({
      status: 503,
      code: 'CONTRACT_DOCUMENT_STORAGE_UNAVAILABLE',
    })
    send.mockRejectedValueOnce(Object.assign(new Error('private path'), { name: 'NotFound' }))
    await expect(storage.inspect('key')).rejects.toMatchObject({ status: 404 })
  })

  it('limita o download autorizado a um minuto e força nome seguro e resposta privada', async () => {
    const url = new URL(
      await new S3ContractDocumentStorage(client, 'private-test').downloadUrl(
        'key',
        'final"\r\n.pdf',
      ),
    )
    expect(url.searchParams.get('X-Amz-Expires')).toBe('60')
    expect(url.searchParams.get('response-cache-control')).toBe('private, no-store')
    expect(url.searchParams.get('response-content-disposition')).toBe(
      'attachment; filename="final___.pdf"',
    )
  })
})
