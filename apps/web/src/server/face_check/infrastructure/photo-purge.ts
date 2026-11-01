import {
  DeleteObjectsCommand,
  ListObjectVersionsCommand,
  type ListObjectVersionsCommandOutput,
  type ObjectIdentifier,
  type S3Client,
} from '@aws-sdk/client-s3'
import { lstat, realpath, rm } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { FaceCheckError } from '../http/errors'
import { captureTokenHash } from './data-cipher'

interface SessionPhotoScope {
  tenantId: string
  sessionId: string
}

export interface S3SessionPhotoPurgeInput extends SessionPhotoScope {
  client: S3Client
  bucket: string
  guard: SessionPhotoPurgeGuard
}

export interface SessionPhotoPurgeGuard {
  assertLease(): Promise<void>
  signal: AbortSignal
}

export interface LocalSessionPhotoPurgeInput extends SessionPhotoScope {
  root?: string
}

const uuidPattern = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/
const tenantPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/
const bucketPattern = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/
const maxDeleteBatch = 1000
const requestTimeoutMs = 30_000

function purgeFailure(): FaceCheckError {
  // SDK errors may contain keys, bucket details or other sensitive values.
  return new FaceCheckError('PHOTO_PURGE_FAILED', 503)
}

function sessionPrefix({ tenantId, sessionId }: SessionPhotoScope): string {
  if (
    typeof tenantId !== 'string' ||
    typeof sessionId !== 'string' ||
    !tenantPattern.test(tenantId) ||
    !uuidPattern.test(sessionId)
  )
    throw purgeFailure()
  return `face_check/${encodeURIComponent(tenantId)}/${sessionId}/`
}

function pageObjects(page: ListObjectVersionsCommandOutput, prefix: string): ObjectIdentifier[] {
  if (typeof page.IsTruncated !== 'boolean') throw purgeFailure()
  const objects: ObjectIdentifier[] = []
  for (const version of [...(page.Versions ?? []), ...(page.DeleteMarkers ?? [])]) {
    if (
      typeof version.Key !== 'string' ||
      !version.Key.startsWith(prefix) ||
      typeof version.VersionId !== 'string' ||
      version.VersionId.length === 0
    )
      throw purgeFailure()
    // Always include VersionId, including the literal "null" version. Omitting
    // it would create another delete marker and leave recoverable photo bytes.
    objects.push({ Key: version.Key, VersionId: version.VersionId })
  }
  return objects
}

async function assertPurgeLease(guard: SessionPhotoPurgeGuard): Promise<void> {
  if (!guard || typeof guard.assertLease !== 'function' || !guard.signal) throw purgeFailure()
  guard.signal.throwIfAborted()
  await guard.assertLease()
  guard.signal.throwIfAborted()
}

async function guardedS3Request<T>(
  guard: SessionPhotoPurgeGuard,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  // Revalidate ownership around every request. An old LIST response must not
  // authorize deletion of new photos collected after another worker took over.
  await assertPurgeLease(guard)
  const controller = new AbortController()
  const abort = () => controller.abort()
  guard.signal.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(abort, requestTimeoutMs)
  timer.unref()
  try {
    guard.signal.throwIfAborted()
    const result = await operation(controller.signal)
    controller.signal.throwIfAborted()
    await assertPurgeLease(guard)
    controller.signal.throwIfAborted()
    return result
  } finally {
    clearTimeout(timer)
    guard.signal.removeEventListener('abort', abort)
    controller.abort()
  }
}

/**
 * Permanently remove versions and delete markers only under this session.
 * The caller must fence session writers before calling and retain a retryable
 * purge state until this resolves. No success is returned for partial deletes
 * or for versions that appear before the final empty-prefix check.
 */
export async function purgeS3SessionPhotos(input: S3SessionPhotoPurgeInput): Promise<void> {
  const prefix = sessionPrefix(input)
  if (
    typeof input.bucket !== 'string' ||
    !bucketPattern.test(input.bucket) ||
    input.bucket.includes('..')
  )
    throw purgeFailure()
  try {
    let keyMarker: string | undefined
    let versionIdMarker: string | undefined
    const cursors = new Set<string>()
    const objects: ObjectIdentifier[] = []
    while (true) {
      const page = await guardedS3Request(input.guard, (abortSignal) =>
        input.client.send(
          new ListObjectVersionsCommand({
            Bucket: input.bucket,
            Prefix: prefix,
            MaxKeys: maxDeleteBatch,
            ...(keyMarker !== undefined ? { KeyMarker: keyMarker } : {}),
            ...(versionIdMarker !== undefined ? { VersionIdMarker: versionIdMarker } : {}),
          }),
          { abortSignal },
        ),
      )
      objects.push(...pageObjects(page, prefix))
      // Finish the metadata listing before deleting its pagination markers.
      // All object bytes stay in S3; only key/version pairs are collected.
      let nextKey: string | undefined
      let nextVersion: string | undefined
      if (page.IsTruncated) {
        nextKey = page.NextKeyMarker
        nextVersion = page.NextVersionIdMarker
        if (
          !nextKey ||
          !nextKey.startsWith(prefix) ||
          typeof nextVersion !== 'string' ||
          nextVersion.length === 0
        )
          throw purgeFailure()
        const cursor = JSON.stringify([nextKey, nextVersion ?? null])
        if (cursors.has(cursor)) throw purgeFailure()
        cursors.add(cursor)
      }
      if (!page.IsTruncated) break
      keyMarker = nextKey
      versionIdMarker = nextVersion
    }
    for (let offset = 0; offset < objects.length; offset += maxDeleteBatch) {
      const deleted = await guardedS3Request(input.guard, (abortSignal) =>
        input.client.send(
          new DeleteObjectsCommand({
            Bucket: input.bucket,
            Delete: { Objects: objects.slice(offset, offset + maxDeleteBatch), Quiet: true },
          }),
          { abortSignal },
        ),
      )
      if (deleted.Errors?.length) throw purgeFailure()
    }
    // Concurrent PUTs, or a silent partial result,
    // must never be mistaken for successful erasure. A retry can safely list
    // again from the beginning; each version-specific deletion is idempotent.
    const remaining = await guardedS3Request(input.guard, (abortSignal) =>
      input.client.send(
        new ListObjectVersionsCommand({ Bucket: input.bucket, Prefix: prefix, MaxKeys: 1 }),
        { abortSignal },
      ),
    )
    if (pageObjects(remaining, prefix).length || remaining.IsTruncated) throw purgeFailure()
  } catch {
    throw purgeFailure()
  }
}

function isMissing(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'
}

/** Remove only a session's encrypted development files, keeping sibling sessions. */
export async function purgeLocalSessionPhotos(input: LocalSessionPhotoPurgeInput): Promise<void> {
  sessionPrefix(input)
  const root = input.root ?? resolve(process.cwd(), '.local/face_check')
  if (
    process.env.NODE_ENV === 'production' ||
    typeof root !== 'string' ||
    !root ||
    !isAbsolute(root)
  )
    throw purgeFailure()
  try {
    let canonicalRoot: string
    try {
      canonicalRoot = await realpath(/* turbopackIgnore: true */ root)
    } catch (error) {
      if (isMissing(error)) return
      throw error
    }
    const tenantDirectory = resolve(root, captureTokenHash(input.tenantId))
    const sessionDirectory = resolve(tenantDirectory, input.sessionId)
    try {
      // Reject a tenant/session symlink rather than following it outside the
      // expected encrypted-photo directory or claiming its target was erased.
      if (
        (await realpath(/* turbopackIgnore: true */ tenantDirectory)) !==
        resolve(canonicalRoot, captureTokenHash(input.tenantId))
      )
        throw purgeFailure()
      const metadata = await lstat(sessionDirectory)
      if (metadata.isSymbolicLink() || !metadata.isDirectory()) throw purgeFailure()
    } catch (error) {
      if (isMissing(error)) return
      throw error
    }
    await rm(sessionDirectory, { recursive: true, force: true })
    try {
      await lstat(sessionDirectory)
    } catch (error) {
      if (isMissing(error)) return
      throw error
    }
    throw purgeFailure()
  } catch {
    throw purgeFailure()
  }
}
