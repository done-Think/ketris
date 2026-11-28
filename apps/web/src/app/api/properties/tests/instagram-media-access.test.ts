import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../media/[...key]/route'

const send = vi.hoisted(() => vi.fn())
vi.mock('@server/shared/storage/s3-client', () => ({
  getS3Client: () => ({ send }),
  getUploadsBucketName: () => 'test-bucket',
  shouldUseLocalUploadsStorage: () => false,
}))
beforeEach(() => send.mockReset())

describe('Public property media and Instagram derivatives', () => {
  it('does not let the legacy public proxy bypass an Instagram photo signature', async () => {
    const response = await GET(
      new NextRequest(
        'https://ketris.example/api/properties/media/properties/tenant-a/instagram/job/0.jpg',
      ),
      { params: Promise.resolve({ key: ['properties', 'tenant-a', 'instagram', 'job', '0.jpg'] }) },
    )
    expect(response.status).toBe(404)
    expect(send).not.toHaveBeenCalled()
  })
  it('preserves access to original property photos', async () => {
    send.mockResolvedValue({
      ContentType: 'image/jpeg',
      Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
    })
    const response = await GET(
      new NextRequest(
        'https://ketris.example/api/properties/media/properties/tenant-a/original.jpg',
      ),
      { params: Promise.resolve({ key: ['properties', 'tenant-a', 'original.jpg'] }) },
    )
    expect(response.status).toBe(200)
    expect(send.mock.calls[0][0].input.Key).toBe('properties/tenant-a/original.jpg')
  })
})
