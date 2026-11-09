// @vitest-environment node
import { randomBytes, randomUUID } from 'node:crypto'
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeleteObjectsCommand, ListObjectVersionsCommand, type S3Client } from '@aws-sdk/client-s3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { captureTokenHash, DataCipher } from '../infrastructure/data-cipher'
import {
  purgeLocalSessionPhotos,
  purgeS3SessionPhotos,
  type SessionPhotoPurgeGuard,
} from '../infrastructure/photo-purge'
import { FaceCheckEvidencePurger } from '../purge'
import type { FaceCheckDatabase } from '../types/access'
import { newSessionRecord } from '../verification/domain/session-rules'

vi.mock('@server/db/prisma', () => ({ prisma: {} }))

const tenantId = 'tenant-a'
const sessionId = 'a16d4200-88a1-4f05-8834-09bfd34b8856'
const bucket = 'private-face-check'
const prefix = `face_check/${tenantId}/${sessionId}/`
const key = `${prefix}synthetic-photo.enc`
const emptyPage = { IsTruncated: false, Versions: [], DeleteMarkers: [] }
const failure = { code: 'PHOTO_PURGE_FAILED', status: 503 }

type Command = ListObjectVersionsCommand | DeleteObjectsCommand
type RequestOptions = { abortSignal?: AbortSignal }

function validGuard(): SessionPhotoPurgeGuard {
  return { assertLease: vi.fn(async () => {}), signal: new AbortController().signal }
}

function s3Mock(responses: unknown[]) {
  const send = vi.fn(async (_command: Command, _options?: RequestOptions) => {
    if (responses.length === 0) throw new Error('Unexpected additional SDK request')
    const response = responses.shift()
    if (response instanceof Error) throw response
    return response
  })
  return { send, client: { send } as unknown as S3Client }
}

interface LeaseWhere {
  id?: string
  tenantId?: string
  revision?: number
  leaseId?: string
  evidencePurgePending?: boolean
  leaseExpiresAt?: { gt: Date }
  AND?: [unknown, LeaseWhere]
}

function purgerFixture() {
  let now = 1_000_000
  const cipher = new DataCipher(randomBytes(32))
  const record = newSessionRecord(
    {
      id: sessionId,
      personName: 'Synthetic Person',
      agencyName: 'Synthetic Agency',
      cpf: null,
      reference: null,
      contact: null,
      acceptedDocument: 'RG',
      createdAt: now,
      expiresAt: now + 86_400_000,
      outcome: 'approve',
      token: 'a'.repeat(64),
      captureMode: 'camera',
      maxAttempts: 3,
    },
    randomUUID(),
  )
  record.session.status = 'REJECTED'
  const state = {
    id: sessionId,
    tenantId,
    revision: 0,
    leaseId: null as string | null,
    leaseExpiresAt: null as Date | null,
    evidencePurgePending: true,
    evidenceDeletedAt: null as Date | null,
    evidenceExpiresAt: new Date(now + 1000),
    encryptedRecord: cipher.encrypt(record, `session:${tenantId}:${sessionId}`),
  }
  function matches(where: LeaseWhere) {
    return (
      (where.id === undefined || where.id === state.id) &&
      (where.tenantId === undefined || where.tenantId === state.tenantId) &&
      (where.revision === undefined || where.revision === state.revision) &&
      (where.leaseId === undefined || where.leaseId === state.leaseId) &&
      (where.evidencePurgePending === undefined ||
        where.evidencePurgePending === state.evidencePurgePending) &&
      (!where.leaseExpiresAt ||
        (!!state.leaseExpiresAt && state.leaseExpiresAt > where.leaseExpiresAt.gt))
    )
  }
  const table = {
    findMany: vi.fn(async () => [{ ...state }]),
    findFirst: vi.fn(async ({ where }: { where: LeaseWhere }) =>
      matches(where) ? { id: state.id } : null,
    ),
    updateMany: vi.fn(
      async ({ where, data }: { where: LeaseWhere; data: Record<string, unknown> }) => {
        if (!matches(where.AND?.[1] ?? where)) return { count: 0 }
        if (typeof data.leaseId === 'string') {
          if (state.leaseId && state.leaseExpiresAt && state.leaseExpiresAt.getTime() > now)
            return { count: 0 }
          state.leaseId = data.leaseId
        } else if (data.leaseId === null) state.leaseId = null
        if (data.leaseExpiresAt instanceof Date || data.leaseExpiresAt === null)
          state.leaseExpiresAt = data.leaseExpiresAt
        if (typeof data.evidencePurgePending === 'boolean')
          state.evidencePurgePending = data.evidencePurgePending
        if (data.evidenceDeletedAt instanceof Date) state.evidenceDeletedAt = data.evidenceDeletedAt
        if (typeof data.encryptedRecord === 'string') state.encryptedRecord = data.encryptedRecord
        if (data.revision) state.revision += 1
        return { count: 1 }
      },
    ),
  }
  return {
    state,
    table,
    cipher,
    clock: () => now,
    advance: (ms: number) => {
      now += ms
    },
    database: { faceCheckSession: table } as unknown as FaceCheckDatabase,
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('versioned S3 session photo purge', () => {
  it('deletes every version and delete marker with explicit version IDs and verifies emptiness', async () => {
    const { send, client } = s3Mock([
      {
        IsTruncated: false,
        Versions: [
          { Key: key, VersionId: 'version-old' },
          { Key: key, VersionId: 'version-new' },
        ],
        DeleteMarkers: [{ Key: key, VersionId: 'delete-marker' }],
      },
      {},
      emptyPage,
    ])
    await purgeS3SessionPhotos({ client, bucket, tenantId, sessionId, guard: validGuard() })
    expect(send.mock.calls[0][0]).toBeInstanceOf(ListObjectVersionsCommand)
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: bucket, Prefix: prefix, MaxKeys: 1000 })
    expect(send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectsCommand)
    expect(send.mock.calls[1][0].input).toEqual({
      Bucket: bucket,
      Delete: {
        Objects: [
          { Key: key, VersionId: 'version-old' },
          { Key: key, VersionId: 'version-new' },
          { Key: key, VersionId: 'delete-marker' },
        ],
        Quiet: true,
      },
    })
    expect(send.mock.calls[2][0].input).toEqual({ Bucket: bucket, Prefix: prefix, MaxKeys: 1 })
  })

  it('follows both pagination markers and keeps every list within the session prefix', async () => {
    const nextKey = `${prefix}second-photo.enc`
    const { send, client } = s3Mock([
      {
        IsTruncated: true,
        Versions: [{ Key: key, VersionId: 'v1' }],
        NextKeyMarker: key,
        NextVersionIdMarker: 'v1',
      },
      { IsTruncated: false, DeleteMarkers: [{ Key: nextKey, VersionId: 'marker2' }] },
      {},
      emptyPage,
    ])
    await purgeS3SessionPhotos({ client, bucket, tenantId, sessionId, guard: validGuard() })
    expect(send.mock.calls[1][0]).toBeInstanceOf(ListObjectVersionsCommand)
    expect(send.mock.calls[1][0].input).toEqual({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 1000,
      KeyMarker: key,
      VersionIdMarker: 'v1',
    })
    expect(send.mock.calls[2][0].input).toMatchObject({
      Delete: {
        Objects: [
          { Key: key, VersionId: 'v1' },
          { Key: nextKey, VersionId: 'marker2' },
        ],
      },
    })
    const lists = send.mock.calls
      .map(([command]) => command)
      .filter((command) => command instanceof ListObjectVersionsCommand)
    expect(lists.every((command) => command.input.Prefix === prefix)).toBe(true)
  })

  it('limits DeleteObjects batches to 1000 even for an oversized combined response page', async () => {
    const versions = Array.from({ length: 1001 }, (_, index) => ({
      Key: `${prefix}photo-${index}.enc`,
      VersionId: `v${index}`,
    }))
    const { send, client } = s3Mock([
      {
        IsTruncated: false,
        Versions: versions,
        DeleteMarkers: [{ Key: key, VersionId: 'marker' }],
      },
      {},
      {},
      emptyPage,
    ])
    await purgeS3SessionPhotos({ client, bucket, tenantId, sessionId, guard: validGuard() })
    const deletes = send.mock.calls
      .map(([command]) => command)
      .filter((command) => command instanceof DeleteObjectsCommand)
    expect(deletes.map((command) => command.input.Delete?.Objects?.length)).toEqual([1000, 2])
    expect(deletes.flatMap((command) => command.input.Delete?.Objects ?? [])).toHaveLength(1002)
  })

  it('deletes the literal null version explicitly for previously unversioned photos', async () => {
    const { send, client } = s3Mock([
      { IsTruncated: false, Versions: [{ Key: key, VersionId: 'null' }] },
      {},
      emptyPage,
    ])
    await purgeS3SessionPhotos({ client, bucket, tenantId, sessionId, guard: validGuard() })
    expect(send.mock.calls[1][0].input).toMatchObject({
      Delete: { Objects: [{ Key: key, VersionId: 'null' }] },
    })
  })

  it('is idempotent when the prefix is already empty and never creates new delete markers', async () => {
    const { send, client } = s3Mock([emptyPage, emptyPage])
    await purgeS3SessionPhotos({ client, bucket, tenantId, sessionId, guard: validGuard() })
    expect(send).toHaveBeenCalledTimes(2)
    expect(send.mock.calls.every(([command]) => command instanceof ListObjectVersionsCommand)).toBe(
      true,
    )
  })

  it('rejects partial delete failures without returning SDK keys or error messages', async () => {
    const { send, client } = s3Mock([
      { IsTruncated: false, Versions: [{ Key: key, VersionId: 'v1' }] },
      { Errors: [{ Key: key, VersionId: 'v1', Code: 'AccessDenied', Message: 'private details' }] },
    ])
    const error = await purgeS3SessionPhotos({
      client,
      bucket,
      tenantId,
      sessionId,
      guard: validGuard(),
    }).catch((value: unknown) => value)
    expect(error).toMatchObject(failure)
    expect((error as Error).message).toBe('PHOTO_PURGE_FAILED')
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('refuses to claim deletion completed when a version or marker remains afterwards', async () => {
    for (const remaining of [
      { IsTruncated: false, Versions: [{ Key: key, VersionId: 'surviving-photo' }] },
      { IsTruncated: false, DeleteMarkers: [{ Key: key, VersionId: 'surviving-marker' }] },
      { IsTruncated: true, Versions: [], DeleteMarkers: [] },
    ]) {
      const { client } = s3Mock([
        { IsTruncated: false, Versions: [{ Key: key, VersionId: 'v1' }] },
        {},
        remaining,
      ])
      await expect(
        purgeS3SessionPhotos({ client, bucket, tenantId, sessionId, guard: validGuard() }),
      ).rejects.toMatchObject(failure)
    }
  })

  it('rejects invalid identifiers before any SDK request', async () => {
    const { send, client } = s3Mock([])
    for (const invalid of [
      { tenantId: '' },
      { tenantId: '../tenant-b' },
      { tenantId: 'tenant-a/tenant-b' },
      { tenantId: 'tenant%2Fb' },
      { sessionId: '../another-session' },
      { sessionId: 'a'.repeat(36) },
      { bucket: '' },
      { bucket: 'other-bucket/face_check' },
    ])
      await expect(
        purgeS3SessionPhotos({
          client,
          bucket,
          tenantId,
          sessionId,
          guard: validGuard(),
          ...invalid,
        }),
      ).rejects.toMatchObject(failure)
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects objects outside the exact tenant/session prefix before deleting any part of a page', async () => {
    for (const foreignKey of [
      `face_check/tenant-b/${sessionId}/other.enc`,
      `face_check/${tenantId}/${randomUUID()}/other.enc`,
      `face_check/${tenantId}/${sessionId}-suffix/other.enc`,
    ]) {
      const { send, client } = s3Mock([
        {
          IsTruncated: false,
          Versions: [
            { Key: key, VersionId: 'v1' },
            { Key: foreignKey, VersionId: 'v2' },
          ],
        },
      ])
      await expect(
        purgeS3SessionPhotos({ client, bucket, tenantId, sessionId, guard: validGuard() }),
      ).rejects.toMatchObject(failure)
      expect(send).toHaveBeenCalledTimes(1)
    }
  })

  it('fails closed for missing version IDs, malformed lists and unsafe pagination markers', async () => {
    for (const page of [
      {},
      { IsTruncated: false, Versions: [{ Key: key }] },
      { IsTruncated: false, DeleteMarkers: [{ Key: key, VersionId: '' }] },
      { IsTruncated: true, NextKeyMarker: key },
      {
        IsTruncated: true,
        NextKeyMarker: 'face_check/tenant-b/foreign',
        NextVersionIdMarker: 'v2',
      },
    ]) {
      const { send, client } = s3Mock([page])
      await expect(
        purgeS3SessionPhotos({ client, bucket, tenantId, sessionId, guard: validGuard() }),
      ).rejects.toMatchObject(failure)
      expect(send).toHaveBeenCalledTimes(1)
    }
  })

  it('stops repeated pagination cursors rather than looping indefinitely', async () => {
    const page = { IsTruncated: true, Versions: [], NextKeyMarker: key, NextVersionIdMarker: 'v1' }
    const { send, client } = s3Mock([page, page])
    await expect(
      purgeS3SessionPhotos({ client, bucket, tenantId, sessionId, guard: validGuard() }),
    ).rejects.toMatchObject(failure)
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('sanitizes SDK failures from listing, deletion and final verification', async () => {
    const page = { IsTruncated: false, Versions: [{ Key: key, VersionId: 'v1' }] }
    for (const responses of [
      [new Error('private listing details')],
      [page, new Error('private delete details')],
      [page, {}, new Error('private verification details')],
    ]) {
      const { client } = s3Mock(responses)
      const error = await purgeS3SessionPhotos({
        client,
        bucket,
        tenantId,
        sessionId,
        guard: validGuard(),
      }).catch((value: unknown) => value)
      expect(error).toMatchObject(failure)
      expect((error as Error).message).toBe('PHOTO_PURGE_FAILED')
    }
  })

  it('requires an active guard before any S3 request', async () => {
    const { send, client } = s3Mock([])
    const controller = new AbortController()
    controller.abort()
    for (const inputGuard of [
      undefined,
      {
        ...validGuard(),
        assertLease: async () => {
          throw new Error('lease no longer owned')
        },
      },
      { ...validGuard(), signal: controller.signal },
    ]) {
      await expect(
        purgeS3SessionPhotos({
          client,
          bucket,
          tenantId,
          sessionId,
          guard: inputGuard as unknown as SessionPhotoPurgeGuard,
        }),
      ).rejects.toMatchObject(failure)
    }
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects a LIST response after lease loss without collecting or deleting its newer version', async () => {
    let owned = true
    const guard: SessionPhotoPurgeGuard = {
      signal: new AbortController().signal,
      assertLease: vi.fn(async () => {
        if (!owned) throw new Error('lease replaced')
      }),
    }
    const send = vi.fn(async (_command: Command) => {
      owned = false
      return {
        IsTruncated: false,
        Versions: [{ Key: `${prefix}new-photo.enc`, VersionId: 'new-version' }],
      }
    })
    await expect(
      purgeS3SessionPhotos({
        client: { send } as unknown as S3Client,
        bucket,
        tenantId,
        sessionId,
        guard,
      }),
    ).rejects.toMatchObject(failure)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0]).toBeInstanceOf(ListObjectVersionsCommand)
    expect(guard.assertLease).toHaveBeenCalledTimes(2)
  })

  it('revalidates ownership before every paginated LIST, delete batch and confirmation', async () => {
    const guard = validGuard()
    const versions = Array.from({ length: 1001 }, (_, index) => ({
      Key: `${prefix}${index}.enc`,
      VersionId: `v${index}`,
    }))
    const { send, client } = s3Mock([
      {
        IsTruncated: true,
        Versions: versions,
        NextKeyMarker: key,
        NextVersionIdMarker: 'cursor-version',
      },
      emptyPage,
      {},
      {},
      emptyPage,
    ])
    await purgeS3SessionPhotos({ client, bucket, tenantId, sessionId, guard })
    expect(send).toHaveBeenCalledTimes(5)
    expect(guard.assertLease).toHaveBeenCalledTimes(10)
    expect(
      send.mock.calls.every(([, options]) => options?.abortSignal instanceof AbortSignal),
    ).toBe(true)
  })

  it('stops subsequent delete batches when ownership changes during a deletion', async () => {
    let owned = true
    const guard: SessionPhotoPurgeGuard = {
      signal: new AbortController().signal,
      assertLease: async () => {
        if (!owned) throw new Error('lease replaced')
      },
    }
    const versions = Array.from({ length: 1001 }, (_, index) => ({
      Key: `${prefix}${index}.enc`,
      VersionId: `v${index}`,
    }))
    const send = vi.fn(async (command: Command) => {
      if (command instanceof DeleteObjectsCommand) {
        owned = false
        return {}
      }
      return { IsTruncated: false, Versions: versions }
    })
    await expect(
      purgeS3SessionPhotos({
        client: { send } as unknown as S3Client,
        bucket,
        tenantId,
        sessionId,
        guard,
      }),
    ).rejects.toMatchObject(failure)
    expect(
      send.mock.calls.filter(([command]) => command instanceof DeleteObjectsCommand),
    ).toHaveLength(1)
  })

  it('aborts a stalled SDK request after 30 seconds without disclosing SDK details', async () => {
    vi.useFakeTimers()
    let started!: () => void
    const ready = new Promise<void>((resolve) => {
      started = resolve
    })
    let requestSignal: AbortSignal | undefined
    const send = vi.fn(async (_command: Command, options?: RequestOptions) => {
      requestSignal = options?.abortSignal
      started()
      return new Promise<never>((_resolve, reject) => {
        requestSignal!.addEventListener(
          'abort',
          () => reject(new Error('private SDK request details')),
          { once: true },
        )
      })
    })
    const result = purgeS3SessionPhotos({
      client: { send } as unknown as S3Client,
      bucket,
      tenantId,
      sessionId,
      guard: validGuard(),
    }).catch((error: unknown) => error)
    await ready
    await vi.advanceTimersByTimeAsync(29_999)
    expect(requestSignal?.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    const error = await result
    expect(error).toMatchObject(failure)
    expect((error as Error).message).toBe('PHOTO_PURGE_FAILED')
    expect(requestSignal?.aborted).toBe(true)
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('propagates the global purge abort to an in-flight SDK request', async () => {
    const controller = new AbortController()
    const guard = { ...validGuard(), signal: controller.signal }
    let started!: () => void
    const ready = new Promise<void>((resolve) => {
      started = resolve
    })
    const send = vi.fn(async (_command: Command, options?: RequestOptions) => {
      started()
      return new Promise<never>((_resolve, reject) => {
        options!.abortSignal!.addEventListener('abort', () => reject(new Error('aborted')), {
          once: true,
        })
      })
    })
    const result = purgeS3SessionPhotos({
      client: { send } as unknown as S3Client,
      bucket,
      tenantId,
      sessionId,
      guard,
    }).catch((error: unknown) => error)
    await ready
    controller.abort()
    expect(await result).toMatchObject(failure)
    expect(send).toHaveBeenCalledTimes(1)
  })
})

describe('durable purge lease guard', () => {
  it('scopes fresh ownership checks to the tenant, revision, lease and pending state', async () => {
    const fixture = purgerFixture()
    const remove = vi.fn(
      async (_tenant: string, _session: string, guard: SessionPhotoPurgeGuard) => {
        await guard.assertLease()
        expect(guard.signal.aborted).toBe(false)
      },
    )
    const purger = new FaceCheckEvidencePurger(
      fixture.database,
      fixture.cipher,
      remove,
      fixture.clock,
    )
    expect(await purger.execute({ sessionId })).toEqual({ deleted: 1, failed: 0 })
    expect(fixture.table.findFirst).toHaveBeenCalledTimes(3)
    expect(fixture.table.findFirst.mock.calls[0][0].where).toMatchObject({
      id: sessionId,
      tenantId,
      revision: 0,
      leaseId: expect.any(String),
      evidencePurgePending: true,
      leaseExpiresAt: { gt: new Date(fixture.clock() + 5000) },
    })
    expect(remove.mock.calls[0][2].signal.aborted).toBe(true)
    expect(fixture.state.evidencePurgePending).toBe(false)
    expect(fixture.state.revision).toBe(1)
  })

  it('does not delete a new attempt when a stalled LIST returns after takeover and new capture', async () => {
    const fixture = purgerFixture()
    let started!: () => void
    let release!: (value: unknown) => void
    const ready = new Promise<void>((resolve) => {
      started = resolve
    })
    const page = new Promise((resolve) => {
      release = resolve
    })
    const send = vi.fn(async (_command: Command) => {
      started()
      return page
    })
    const purger = new FaceCheckEvidencePurger(
      fixture.database,
      fixture.cipher,
      async (tenant, session, guard) =>
        purgeS3SessionPhotos({
          client: { send } as unknown as S3Client,
          bucket,
          tenantId: tenant,
          sessionId: session,
          guard,
        }),
      fixture.clock,
    )
    const result = purger.execute({ sessionId })
    await ready
    // Another worker reclaimed the expired lease, completed erasure and let a
    // new capture PUT a different key/version under this same session prefix.
    fixture.advance(181_000)
    fixture.state.revision = 2
    fixture.state.leaseId = null
    fixture.state.leaseExpiresAt = null
    fixture.state.evidencePurgePending = false
    fixture.state.encryptedRecord = 'ciphertext belonging to the new capture'
    const newVersion = { Key: `${prefix}new-attempt.enc`, VersionId: 'new-attempt-version' }
    release({ IsTruncated: false, Versions: [newVersion] })
    expect(await result).toEqual({ deleted: 0, failed: 1 })
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0]).toBeInstanceOf(ListObjectVersionsCommand)
    expect(fixture.state.revision).toBe(2)
    expect(fixture.state.evidencePurgePending).toBe(false)
    expect(fixture.state.encryptedRecord).toBe('ciphertext belonging to the new capture')
  })

  it('aborts globally five seconds before the 180-second lease expires and keeps retry pending', async () => {
    vi.useFakeTimers()
    const fixture = purgerFixture()
    let started!: () => void
    const ready = new Promise<void>((resolve) => {
      started = resolve
    })
    let signal: AbortSignal | undefined
    const purger = new FaceCheckEvidencePurger(
      fixture.database,
      fixture.cipher,
      async (_tenant, _session, guard) => {
        signal = guard.signal
        started()
        await new Promise<never>((_resolve, reject) => {
          signal!.addEventListener('abort', () => reject(new Error('global deadline')), {
            once: true,
          })
        })
      },
      fixture.clock,
    )
    const result = purger.execute({ sessionId })
    await ready
    fixture.advance(174_999)
    await vi.advanceTimersByTimeAsync(174_999)
    expect(signal?.aborted).toBe(false)
    fixture.advance(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(signal?.aborted).toBe(true)
    expect(await result).toEqual({ deleted: 0, failed: 1 })
    expect(fixture.state.evidencePurgePending).toBe(true)
    expect(fixture.state.leaseId).toBeNull()
    expect(fixture.state.revision).toBe(0)
  })
})

describe('local development session photo purge', () => {
  const roots: string[] = []

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
  })

  async function rootDirectory() {
    const root = await mkdtemp(join(tmpdir(), 'ketris-photo-purge-'))
    roots.push(root)
    return root
  }

  it('removes only the selected encrypted session files and leaves other tenants/sessions intact', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const root = await rootDirectory()
    const selected = join(root, captureTokenHash(tenantId), sessionId)
    const sibling = join(root, captureTokenHash(tenantId), randomUUID())
    const foreign = join(root, captureTokenHash('tenant-b'), sessionId)
    for (const directory of [selected, sibling, foreign]) {
      await mkdir(directory, { recursive: true })
      await writeFile(join(directory, 'photo.enc'), 'synthetic ciphertext')
    }
    await purgeLocalSessionPhotos({ tenantId, sessionId, root })
    await expect(access(selected)).rejects.toMatchObject({ code: 'ENOENT' })
    expect(await readFile(join(sibling, 'photo.enc'), 'utf8')).toBe('synthetic ciphertext')
    expect(await readFile(join(foreign, 'photo.enc'), 'utf8')).toBe('synthetic ciphertext')
    await expect(purgeLocalSessionPhotos({ tenantId, sessionId, root })).resolves.toBeUndefined()
  })

  it('is idempotent when the root or tenant directory does not exist', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const root = await rootDirectory()
    await expect(purgeLocalSessionPhotos({ tenantId, sessionId, root })).resolves.toBeUndefined()
    await expect(
      purgeLocalSessionPhotos({ tenantId, sessionId, root: join(root, 'missing') }),
    ).resolves.toBeUndefined()
  })

  it('rejects production local deletion, path traversal and relative roots', async () => {
    const root = await rootDirectory()
    vi.stubEnv('NODE_ENV', 'production')
    await expect(purgeLocalSessionPhotos({ tenantId, sessionId, root })).rejects.toMatchObject(
      failure,
    )
    vi.stubEnv('NODE_ENV', 'test')
    await expect(
      purgeLocalSessionPhotos({ tenantId, sessionId: '../other', root }),
    ).rejects.toMatchObject(failure)
    await expect(
      purgeLocalSessionPhotos({ tenantId, sessionId, root: './relative' }),
    ).rejects.toMatchObject(failure)
  })

  it('does not follow a tenant or session symlink into another directory', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const root = await rootDirectory()
    const outside = await rootDirectory()
    await writeFile(join(outside, 'photo.enc'), 'must survive')
    const tenantDirectory = join(root, captureTokenHash(tenantId))
    await symlink(outside, tenantDirectory, 'dir')
    await expect(purgeLocalSessionPhotos({ tenantId, sessionId, root })).rejects.toMatchObject(
      failure,
    )
    expect(await readFile(join(outside, 'photo.enc'), 'utf8')).toBe('must survive')
    await rm(tenantDirectory)
    await mkdir(tenantDirectory)
    await symlink(outside, join(tenantDirectory, sessionId), 'dir')
    await expect(purgeLocalSessionPhotos({ tenantId, sessionId, root })).rejects.toMatchObject(
      failure,
    )
    expect(await readFile(join(outside, 'photo.enc'), 'utf8')).toBe('must survive')
  })
})
