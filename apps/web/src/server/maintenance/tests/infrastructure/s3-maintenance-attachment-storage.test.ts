// @vitest-environment node
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { S3MaintenanceAttachmentStorage } from '../../infrastructure/s3-maintenance-attachment-storage'
const mocks = vi.hoisted(() => ({ send: vi.fn(), sign: vi.fn() }))
vi.mock('@server/shared/storage/s3-client', () => ({
  getS3Client: () => ({ send: mocks.send }),
  getUploadsBucketName: () => 'private-bucket',
}))
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: mocks.sign }))

describe('S3MaintenanceAttachmentStorage', () => {
  const storage = new S3MaintenanceAttachmentStorage()
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.sign.mockResolvedValue('https://private.example.test/signed')
  })
  it('signs upload size, type and checksum for ten minutes', async () => {
    const sha256 = 'ab'.repeat(32)
    const result = await storage.uploadLocation('maintenance/tenant/object.png', {
      uploadId: 'upload',
      actorId: 'actor',
      tenantId: 'tenant',
      ticketId: 'ticket',
      filename: 'repair.png',
      size: 8 * 1024 * 1024,
      contentType: 'image/png',
      sha256,
    })
    const [, command, options] = mocks.sign.mock.calls[0]
    expect(command).toBeInstanceOf(PutObjectCommand)
    expect(command.input).toMatchObject({
      Bucket: 'private-bucket',
      ContentLength: 8 * 1024 * 1024,
      ContentType: 'image/png',
      ChecksumSHA256: Buffer.from(sha256, 'hex').toString('base64'),
    })
    expect(options).toMatchObject({
      expiresIn: 600,
      signableHeaders: new Set(['content-type', 'content-length']),
      unhoistableHeaders: new Set(['x-amz-checksum-sha256']),
    })
    expect(result.headers).toEqual({
      'Content-Type': 'image/png',
      'x-amz-checksum-sha256': command.input.ChecksumSHA256,
    })
  })
  it('checks the stored object checksum and metadata before completion', async () => {
    mocks.send.mockResolvedValue({
      ContentLength: 123,
      ContentType: 'image/png',
      ChecksumSHA256: Buffer.from('ab'.repeat(32), 'hex').toString('base64'),
    })
    expect(await storage.inspect('key')).toEqual({
      size: 123,
      contentType: 'image/png',
      sha256: 'ab'.repeat(32),
    })
    expect(mocks.send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand)
    expect(mocks.send.mock.calls[0][0].input.ChecksumMode).toBe('ENABLED')
  })
  it('redirects downloads through a sixty-second URL without proxying binary data', async () => {
    mocks.send.mockResolvedValue({ ContentType: 'image/png' })
    expect(await storage.download('key')).toEqual({ url: 'https://private.example.test/signed' })
    const [, command, options] = mocks.sign.mock.calls[0]
    expect(command).toBeInstanceOf(GetObjectCommand)
    expect(command.input.ResponseCacheControl).toBe('private, no-store')
    expect(options.expiresIn).toBe(60)
  })
  it('distinguishes a missing file from storage unavailability', async () => {
    mocks.send.mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'NotFound' }))
    expect(await storage.download('missing')).toBeNull()
    mocks.send.mockRejectedValueOnce(new Error('network'))
    await expect(storage.download('key')).rejects.toMatchObject({
      status: 503,
      code: 'MAINTENANCE_STORAGE_UNAVAILABLE',
    })
  })
})
