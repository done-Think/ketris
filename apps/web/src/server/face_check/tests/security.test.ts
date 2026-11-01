// @vitest-environment node
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataCipher, captureTokenHash } from '../infrastructure/data-cipher'
import { LocalPhotoStore } from '../infrastructure/local-photo-store'
import { S3PhotoStore } from '../infrastructure/s3-photo-store'
import { CaptureRateLimit } from '../infrastructure/capture-rate-limit'
import { capturedImage, assertMutationOrigin, photoForm, readBodyBytes } from '../http/request'
import { createSessionBodySchema } from '../schemas/api.schemas'
import { maxCapturePhotoBytes, maxUploadBodyBytes } from '../config/upload-limits'
import type { SessionRepository } from '../types/verification.types'
import type { FaceCheckDatabase } from '../types/access'
import { createInput } from './fixtures/verification-harness'

afterEach(() => vi.unstubAllEnvs())

describe('face_check encryption and evidence privacy', () => {
  it('encrypts personal data and tokens with randomized authenticated contexts', () => {
    const cipher = new DataCipher(randomBytes(32))
    const payload = { cpf: '12345678900', token: 'secret-token', bytes: 'photo' }
    const encrypted = cipher.encrypt(payload, 'session:A:1')
    expect(encrypted).not.toContain(payload.cpf)
    expect(encrypted).not.toContain(payload.token)
    expect(encrypted).not.toEqual(cipher.encrypt(payload, 'session:A:1'))
    expect(cipher.decrypt(encrypted, 'session:A:1')).toEqual(payload)
    expect(() => cipher.decrypt(encrypted, 'session:B:1')).toThrow()
    expect(() => new DataCipher(randomBytes(32)).decrypt(encrypted, 'session:A:1')).toThrow()
    const components = encrypted.split('.')
    components[3] = Buffer.from('tampered').toString('base64')
    expect(() => cipher.decrypt(components.join('.'), 'session:A:1')).toThrow()
  })

  it('keeps S3 objects private and authorizes every evidence read before returning bytes', async () => {
    const sessionId = randomUUID(),
      evidenceId = randomUUID()
    let allowed = true
    let ciphertext = ''
    const send = vi.fn(async (command: { input: Record<string, unknown> }) => {
      if (command.input.Body) {
        ciphertext = String(command.input.Body)
        return {}
      }
      return { Body: { transformToString: async () => ciphertext } }
    })
    const sessions = {
      read: async () => (allowed ? { session: {} } : null),
    } as unknown as SessionRepository
    const store = new S3PhotoStore(
      { send } as unknown as S3Client,
      'private-bucket',
      'tenant-a',
      new DataCipher(randomBytes(32)),
      sessions,
    )
    const image = { bytes: new Uint8Array([9, 8, 7]), contentType: 'image/jpeg' }
    await store.save(sessionId, evidenceId, image)
    expect(send.mock.calls[0][0].input).toMatchObject({
      Key: `face_check/tenant-a/${sessionId}/${evidenceId}.enc`,
      ContentType: 'application/octet-stream',
      CacheControl: 'no-store',
      ServerSideEncryption: 'AES256',
    })
    expect(send.mock.calls[0][0].input).not.toHaveProperty('ACL')
    expect(ciphertext).not.toContain(Buffer.from(image.bytes).toString('base64'))
    expect(await store.load(sessionId, evidenceId)).toEqual(image)
    allowed = false
    const calls = send.mock.calls.length
    await expect(store.load(sessionId, evidenceId)).rejects.toMatchObject({
      code: 'SESSION_NOT_FOUND',
    })
    expect(send).toHaveBeenCalledTimes(calls)
  })

  it('stores only ciphertext locally in development and refuses local storage in production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const root = await mkdtemp(join(tmpdir(), 'face_check_photos_'))
    try {
      const sessions = { read: async () => ({ session: {} }) } as unknown as SessionRepository
      const sessionId = randomUUID(),
        evidenceId = randomUUID()
      const store = new LocalPhotoStore('tenant-a', new DataCipher(randomBytes(32)), sessions, root)
      await store.save(sessionId, evidenceId, {
        bytes: new Uint8Array([1, 2, 3]),
        contentType: 'image/png',
      })
      const stored = await readFile(
        join(root, captureTokenHash('tenant-a'), sessionId, `${evidenceId}.enc`),
        'utf8',
      )
      expect(stored.startsWith('v1.')).toBe(true)
      expect(stored).not.toContain('image/png')
      vi.stubEnv('NODE_ENV', 'production')
      await expect(store.load(sessionId, evidenceId)).rejects.toMatchObject({
        code: 'STORAGE_UNAVAILABLE',
      })
      expect(
        () => new LocalPhotoStore('tenant-a', new DataCipher(randomBytes(32)), sessions, root),
      ).toThrow()
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

describe('face_check ingress protections', () => {
  it('bounds feedback image bytes and decoded pixels more tightly than evidence uploads', async () => {
    const limits = { maxBytes: 512 * 1024, maxPixels: 1024 * 1024 }
    const png = await sharp({
      create: { width: 640, height: 360, channels: 3, background: 'white' },
    })
      .png()
      .toBuffer()
    expect((await capturedImage(new Blob([png], { type: 'image/png' }), limits)).bytes.length).toBe(
      png.length,
    )
    await expect(
      capturedImage(new Blob([new Uint8Array(limits.maxBytes + 1)], { type: 'image/png' }), limits),
    ).rejects.toMatchObject({ status: 413 })
    const tooLarge = await sharp({
      create: { width: 1025, height: 1024, channels: 3, background: 'white' },
    })
      .png()
      .toBuffer()
    await expect(
      capturedImage(new Blob([tooLarge], { type: 'image/png' }), limits),
    ).rejects.toMatchObject({ code: 'INVALID_IMAGE' })
  })

  it('limits feedback probes without consuming the evidence upload quota', async () => {
    const counters = new Map<string, number>()
    const database = {
      faceCheckRateLimit: {
        upsert: async ({ where }: { where: { key: string } }) => {
          const count = (counters.get(where.key) ?? 0) + 1
          counters.set(where.key, count)
          return { count }
        },
        deleteMany: async () => ({ count: 0 }),
      },
    } as unknown as FaceCheckDatabase
    const limiter = new CaptureRateLimit(database, randomBytes(32), () => 123_000)
    for (let count = 0; count < 60; count++) await limiter.consume('ip', 'token', 'feedback')
    await expect(limiter.consume('ip', 'token', 'feedback')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    })
    await expect(limiter.consume('ip', 'token', true)).resolves.toBeUndefined()
    expect(counters.size).toBe(4)
  })
  it('requires propertyId and rejects injected tenant, role and approval fields', () => {
    expect(createSessionBodySchema.parse(createInput)).toMatchObject({
      propertyId: 'property-1',
      purpose: 'RENT',
    })
    expect(
      createSessionBodySchema.safeParse({ ...createInput, propertyId: undefined }).success,
    ).toBe(false)
    for (const extra of [
      { tenantId: 'other' },
      { role: 'OWNER' },
      { status: 'APPROVED' },
      { requestedById: 'other' },
      { candidateUserId: 'other' },
    ])
      expect(createSessionBodySchema.safeParse({ ...createInput, ...extra }).success).toBe(false)
  })

  it('enforces a byte limit on streamed bodies without content-length', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(4))
        controller.enqueue(new Uint8Array(4))
        controller.close()
      },
    })
    const request = new Request('https://app.test/api', {
      method: 'POST',
      body,
      duplex: 'half',
    } as RequestInit)
    await expect(readBodyBytes(request, 7)).rejects.toMatchObject({
      code: 'PAYLOAD_TOO_LARGE',
      status: 413,
    })
    expect(maxUploadBodyBytes).toBe(3 * 1024 * 1024 + 64 * 1024)
  })

  it('decodes pixels, checks actual MIME and prevents oversize and multiple-file uploads', async () => {
    const png = await sharp({ create: { width: 64, height: 64, channels: 3, background: 'white' } })
      .png()
      .toBuffer()
    expect((await capturedImage(new Blob([png], { type: 'image/png' }))).bytes.length).toBe(
      png.length,
    )
    await expect(capturedImage(new Blob([png], { type: 'image/jpeg' }))).rejects.toMatchObject({
      code: 'INVALID_IMAGE',
    })
    await expect(
      capturedImage(new Blob([new Uint8Array(maxCapturePhotoBytes + 1)], { type: 'image/png' })),
    ).rejects.toMatchObject({ status: 413 })
    const oversizedPixels = await sharp({
      create: { width: 4001, height: 4000, channels: 3, background: 'white' },
    })
      .png()
      .toBuffer()
    await expect(
      capturedImage(new Blob([oversizedPixels], { type: 'image/png' })),
    ).rejects.toMatchObject({ code: 'INVALID_IMAGE' })
    const form = new FormData()
    form.set('image', new Blob([png], { type: 'image/png' }), 'one.png')
    form.set('other', new Blob([png], { type: 'image/png' }), 'two.png')
    await expect(
      photoForm(new Request('https://app.test', { method: 'POST', body: form })),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects foreign or missing public capture origins while allowing configured same-origin requests', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.test')
    expect(() =>
      assertMutationOrigin(
        new Request('https://internal.test', {
          method: 'POST',
          headers: { origin: 'https://evil.test', 'x-forwarded-host': 'app.test' },
        }),
        true,
      ),
    ).toThrow()
    expect(() =>
      assertMutationOrigin(new Request('https://app.test', { method: 'POST' }), true),
    ).toThrow()
    expect(() =>
      assertMutationOrigin(
        new Request('https://internal.test', {
          method: 'POST',
          headers: { origin: 'https://app.test', 'sec-fetch-site': 'same-origin' },
        }),
        true,
      ),
    ).not.toThrow()
  })

  it('persists distributed limits using hashes, and rejects a token before more work is accepted', async () => {
    const counters = new Map<string, number>()
    const database = {
      faceCheckRateLimit: {
        upsert: vi.fn(async ({ where }: { where: { key: string } }) => {
          const count = (counters.get(where.key) ?? 0) + 1
          counters.set(where.key, count)
          return { count }
        }),
        deleteMany: vi.fn(async () => ({ count: 0 })),
      },
    } as unknown as FaceCheckDatabase
    const limiter = new CaptureRateLimit(database, randomBytes(32), () => 123_000)
    for (let count = 0; count < 30; count++)
      await limiter.consume(`ip-${count}`, 'private-token', true)
    await expect(limiter.consume('new-ip', 'private-token', true)).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      status: 429,
    })
    expect([...counters.keys()].every((key) => /^[a-f0-9]{64}$/.test(key))).toBe(true)
  })
})
