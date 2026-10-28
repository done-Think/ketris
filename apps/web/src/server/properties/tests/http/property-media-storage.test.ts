// @vitest-environment node
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { NextRequest } from 'next/server'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { send, captureException } = vi.hoisted(() => ({ send: vi.fn(), captureException: vi.fn() }))
vi.mock('@server/db/prisma', () => ({ prisma: {} }))
vi.mock('@server/auth/container', () => ({ authContainer: { tokenService: {} } }))
vi.mock('@server/auth/require-bearer-auth', () => ({
  requireBearerAuth: async () => ({ sub: 'owner-1', tenantId: 'tenant-1', role: 'OWNER' }),
}))
vi.mock('@sentry/nextjs', () => ({ captureException }))
vi.mock('@server/shared/storage/s3-client', async () => ({
  ...(await vi.importActual<typeof import('@server/shared/storage/s3-client')>(
    '@server/shared/storage/s3-client',
  )),
  getS3Client: () => ({ send }),
}))

let directory: string
beforeAll(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'ketris-property-upload-'))
})
afterAll(async () => {
  await rm(directory, { recursive: true, force: true })
})
beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubEnv('NODE_ENV', 'development')
  vi.stubEnv('AWS_REGION', 'us-east-1')
  vi.stubEnv('S3_BUCKET_NAME', 'unit-private-bucket')
  for (const name of [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_PROFILE',
    'AWS_WEB_IDENTITY_TOKEN_FILE',
    'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI',
    'AWS_CONTAINER_CREDENTIALS_FULL_URI',
  ])
    vi.stubEnv(name, '')
  send.mockRejectedValue(
    Object.assign(new Error('Could not load credentials from any providers'), {
      name: 'CredentialsProviderError',
    }),
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

async function routes() {
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(directory)
  try {
    const { POST } = await import('@/app/api/properties/media/route')
    const { GET } = await import('@/app/api/properties/media/[...key]/route')
    return { POST, GET }
  } finally {
    cwd.mockRestore()
  }
}
function uploadRequest() {
  const form = new FormData()
  form.set(
    'file',
    new File([new Uint8Array([255, 216, 255, 217])], 'fachada.JPG', { type: 'image/jpeg' }),
  )
  return new NextRequest('http://localhost/api/properties/media', { method: 'POST', body: form })
}

describe('property media storage through the actual composition and HTTP handlers', () => {
  it('uploads JPG and reads its bytes locally without AWS credentials', async () => {
    const { POST, GET } = await routes()
    const response = await POST(uploadRequest())
    expect(response.status).toBe(201)
    const { media } = await response.json()
    expect(media).toMatchObject({
      url: expect.stringMatching(
        /^\/api\/properties\/media\/properties\/tenant-1\/.+-fachada.JPG$/,
      ),
      contentType: 'image/jpeg',
    })
    const key = media.url.slice('/api/properties/media/'.length)
    expect(await readFile(path.join(directory, '.local/uploads/properties', key))).toEqual(
      Buffer.from([255, 216, 255, 217]),
    )
    const image = await GET(new NextRequest('http://localhost' + media.url), {
      params: Promise.resolve({ key: key.split('/') }),
    })
    expect(image.status).toBe(200)
    expect(image.headers.get('Content-Type')).toBe('image/jpeg')
    expect(Buffer.from(await image.arrayBuffer())).toEqual(Buffer.from([255, 216, 255, 217]))
    expect(send).not.toHaveBeenCalled()
  })
  it('returns 404 for a missing local image without contacting S3', async () => {
    const { GET } = await routes()
    const response = await GET(
      new NextRequest('http://localhost/api/properties/media/properties/tenant-1/missing.jpg'),
      { params: Promise.resolve({ key: ['properties', 'tenant-1', 'missing.jpg'] }) },
    )
    expect(response.status).toBe(404)
    expect(send).not.toHaveBeenCalled()
  })
  it.each(['production', 'development'])(
    'returns a specific 503 for cloud failure in %s without silently switching storage',
    async (mode) => {
      vi.stubEnv('NODE_ENV', mode)
      if (mode === 'development') vi.stubEnv('AWS_PROFILE', 'unit-expired-profile')
      const { POST } = await routes()
      const response = await POST(uploadRequest())
      expect(response.status).toBe(503)
      const body = await response.json()
      expect(body.error).toMatchObject({
        code: 'PROPERTY_MEDIA_STORAGE_UNAVAILABLE',
        message: expect.stringContaining('serviço de imagens'),
      })
      expect(JSON.stringify(body)).not.toMatch(
        /CredentialsProviderError|Could not load credentials|stack/,
      )
      expect(captureException).toHaveBeenCalled()
    },
  )
  it('preserves successful uploads when S3 is configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    send.mockResolvedValue({})
    const { POST } = await routes()
    const response = await POST(uploadRequest())
    expect(response.status).toBe(201)
    expect(send.mock.calls[0][0].input).toMatchObject({
      Bucket: 'unit-private-bucket',
      ContentType: 'image/jpeg',
      Body: Buffer.from([255, 216, 255, 217]),
    })
    expect((await response.json()).media.url).toMatch(
      /^\/api\/properties\/media\/properties\/tenant-1\//,
    )
  })
  it('maps cloud image-read failures to the same public 503 contract', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { GET } = await routes()
    const response = await GET(
      new NextRequest('http://localhost/api/properties/media/properties/tenant-1/photo.jpg'),
      { params: Promise.resolve({ key: ['properties', 'tenant-1', 'photo.jpg'] }) },
    )
    expect(response.status).toBe(503)
    expect((await response.json()).error.code).toBe('PROPERTY_MEDIA_STORAGE_UNAVAILABLE')
    expect(captureException).toHaveBeenCalledTimes(1)
  })
})
