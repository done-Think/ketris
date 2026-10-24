import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as avatarMedia } from '@/app/api/auth/media/[...key]/route'
import { GET as propertyMedia } from '@/app/api/properties/media/[...key]/route'
import { GET as profileMedia } from '@/app/api/marketplace/media/[...key]/route'

const { send, readLocalUpload, useLocal } = vi.hoisted(() => ({
  send: vi.fn(),
  readLocalUpload: vi.fn(),
  useLocal: vi.fn(() => false),
}))

vi.mock('@server/shared/storage/s3-client', () => ({
  getS3Client: () => ({ send }),
  getUploadsBucketName: () => 'uploads',
  shouldUseLocalUploadsStorage: useLocal,
}))
vi.mock('@server/shared/storage/local-media-storage', () => ({
  readLocalUpload,
  getContentTypeFromMediaKey: () => 'image/jpeg',
}))

const request = new NextRequest('http://localhost/api/properties/media/key')

beforeEach(() => {
  vi.clearAllMocks()
  useLocal.mockReturnValue(false)
  send.mockResolvedValue({
    Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
    ContentType: 'image/jpeg',
  })
})

describe.each([
  {
    name: 'avatars',
    handler: avatarMedia,
    allowed: ['avatars', 'tenant-1', 'user-1', 'avatar.png'],
  },
  { name: 'properties', handler: propertyMedia, allowed: ['properties', 'tenant-1', 'photo.jpg'] },
  {
    name: 'profiles',
    handler: profileMedia,
    allowed: ['profiles', 'brokers', 'user-1', 'avatar.jpg'],
  },
])('public $name media', ({ handler, allowed }) => {
  it.each([
    ['maintenance', 'tenant-1', 'private.jpg'],
    ['properties-other', 'tenant-1', 'photo.jpg'],
    ['properties'],
    ['profiles', 'private', 'tenant-1', 'file.jpg'],
    [],
  ])('rejects keys outside its scope: %j', async (...key) => {
    const response = await handler(request, { params: Promise.resolve({ key }) })
    expect(response.status).toBe(404)
    expect(send).not.toHaveBeenCalled()
    expect(readLocalUpload).not.toHaveBeenCalled()
  })

  it.each(['..', '.', '', '%2e%2e', '..\\secret', '../secret'])(
    'rejects unsafe segments: %s',
    async (segment) => {
      const response = await handler(request, {
        params: Promise.resolve({ key: [...allowed.slice(0, -1), segment] }),
      })
      expect(response.status).toBe(404)
      expect(send).not.toHaveBeenCalled()
    },
  )

  it('serves an allowed image from storage', async () => {
    const response = await handler(request, { params: Promise.resolve({ key: allowed }) })
    expect(response.status).toBe(200)
    expect(send.mock.calls[0][0].input.Key).toBe(allowed.join('/'))
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
  })
})

it('rejects private keys before accessing local profile storage', async () => {
  useLocal.mockReturnValue(true)
  const response = await profileMedia(request, {
    params: Promise.resolve({ key: ['maintenance', 'tenant-1', 'private.jpg'] }),
  })
  expect(response.status).toBe(404)
  expect(readLocalUpload).not.toHaveBeenCalled()
})
