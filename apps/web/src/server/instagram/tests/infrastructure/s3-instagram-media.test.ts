import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { S3InstagramMedia } from '../../infrastructure/s3-instagram-media'
import { configureInstagramTestEnv } from '../fixtures/environment'

const send = vi.hoisted(() => vi.fn())
vi.mock('@server/shared/storage/s3-client', () => ({
  getS3Client: () => ({ send }),
  getUploadsBucketName: () => 'test-bucket',
}))
beforeEach(() => {
  configureInstagramTestEnv()
  send.mockReset()
})
afterEach(() => vi.unstubAllEnvs())

describe('Tenant-scoped Instagram photos', () => {
  it('rejects external hosts and another tenant prefix without reading any object', async () => {
    const media = new S3InstagramMedia()
    await expect(
      media.prepare('tenant-a', 'job', ['https://attacker.example/photo.jpg']),
    ).rejects.toMatchObject({ code: 'INSTAGRAM_UNSUPPORTED_MEDIA' })
    await expect(
      media.prepare('tenant-a', 'job', ['/api/properties/media/properties/tenant-b/photo.jpg']),
    ).rejects.toMatchObject({ code: 'INSTAGRAM_UNSUPPORTED_MEDIA' })
    expect(send).not.toHaveBeenCalled()
  })
  it('converts a PNG to a separate square JPEG while preserving the original', async () => {
    const original = await sharp({
      create: { width: 80, height: 40, channels: 3, background: { r: 0, g: 100, b: 0 } },
    })
      .png()
      .toBuffer()
    send
      .mockResolvedValueOnce({
        ContentLength: original.length,
        Body: { transformToByteArray: async () => original },
      })
      .mockResolvedValueOnce({})
    const keys = await new S3InstagramMedia().prepare('tenant-a', 'job', [
      '/api/properties/media/properties/tenant-a/photo.png',
    ])
    expect(keys).toEqual(['properties/tenant-a/instagram/job/0.jpg'])
    const uploaded = send.mock.calls[1][0].input
    expect(uploaded.Key).not.toBe('properties/tenant-a/photo.png')
    expect(uploaded.ContentType).toBe('image/jpeg')
    expect(await sharp(uploaded.Body).metadata()).toMatchObject({
      width: 1080,
      height: 1080,
      format: 'jpeg',
    })
    expect(await sharp(original).metadata()).toMatchObject({ width: 80, height: 40, format: 'png' })
  })
  it('fails a deletion with per-object errors instead of claiming success', async () => {
    send.mockResolvedValueOnce({ Errors: [{ Code: 'AccessDenied' }] })
    await expect(new S3InstagramMedia().remove(['derived.jpg'])).rejects.toMatchObject({
      code: 'INSTAGRAM_MEDIA_DELETION_FAILED',
    })
  })
})
