import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/instagram/media/[id]/[index]/route'
import { mediaSignature } from '../../infrastructure/token-vault'
import { configureInstagramTestEnv } from '../fixtures/environment'

const mocks = vi.hoisted(() => ({ publication: vi.fn(), send: vi.fn() }))
vi.mock('@server/instagram/container', () => ({
  instagramContainer: { repository: { publication: mocks.publication } },
}))
vi.mock('@server/shared/storage/s3-client', () => ({
  getS3Client: () => ({ send: mocks.send }),
  getUploadsBucketName: () => 'test-bucket',
}))
beforeEach(() => {
  configureInstagramTestEnv()
  mocks.publication.mockReset().mockResolvedValue({
    preparedKeys: ['properties/tenant-a/instagram/job/0.jpg'],
    status: 'READY',
  })
  mocks.send
    .mockReset()
    .mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) } })
})
afterEach(() => vi.unstubAllEnvs())

describe('Expiring media URL for Meta', () => {
  it('serves a signed photo to Meta without exposing connection data or requiring a session', async () => {
    const expires = Math.floor(Date.now() / 1000) + 120
    const signature = mediaSignature(`job/0/${expires}`)
    const response = await GET(
      new NextRequest(
        `https://ketris.example/api/instagram/media/job/0?expires=${expires}&signature=${signature}`,
      ),
      { params: Promise.resolve({ id: 'job', index: '0' }) },
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([1, 2, 3])
  })
  it('rejects expired and tampered URLs before reading any tenant data', async () => {
    const expires = Math.floor(Date.now() / 1000) - 1
    const signature = mediaSignature(`job/0/${expires}`)
    const expired = await GET(
      new NextRequest(
        `https://ketris.example/api/instagram/media/job/0?expires=${expires}&signature=${signature}`,
      ),
      { params: Promise.resolve({ id: 'job', index: '0' }) },
    )
    const tampered = await GET(
      new NextRequest(
        `https://ketris.example/api/instagram/media/other/0?expires=${expires + 120}&signature=${signature}`,
      ),
      { params: Promise.resolve({ id: 'other', index: '0' }) },
    )
    expect(expired.status).toBe(404)
    expect(tampered.status).toBe(404)
    expect(mocks.publication).not.toHaveBeenCalled()
    expect(mocks.send).not.toHaveBeenCalled()
  })
})
