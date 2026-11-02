import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { FaceCheckError } from '../http/errors'
import type { CapturedImage } from '../types/face-match.types'
import type { PhotoStore, SessionRepository } from '../types/verification.types'
import { DataCipher } from './data-cipher'
import { evidenceUnavailable } from '../verification/domain/evidence-policy'

interface EncryptedPhoto {
  contentType: string
  bytes: string
}

export class S3PhotoStore implements PhotoStore {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
    private readonly tenantId: string,
    private readonly cipher: DataCipher,
    private readonly sessions: SessionRepository,
  ) {
    if (!bucket) throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
  }

  private async key(sessionId: string, evidenceId: string, writing = false) {
    if (!/^[a-f0-9-]{36}$/.test(sessionId) || !/^[a-f0-9-]{36}$/.test(evidenceId))
      throw new FaceCheckError('EVIDENCE_NOT_FOUND', 404)
    const record = await this.sessions.read({ id: sessionId })
    if (!record) throw new FaceCheckError('SESSION_NOT_FOUND', 404)
    if (writing ? record.session.evidencePurgePending : evidenceUnavailable(record.session))
      throw new FaceCheckError('EVIDENCE_DELETED', 410)
    if (
      writing &&
      record.session.evidenceExpiresAt &&
      !record.session.evidenceDeletedAt &&
      Date.parse(record.session.evidenceExpiresAt) <= Date.now()
    )
      throw new FaceCheckError('EVIDENCE_DELETED', 410)
    return `face_check/${encodeURIComponent(this.tenantId)}/${sessionId}/${evidenceId}.enc`
  }

  async save(sessionId: string, evidenceId: string, image: CapturedImage) {
    await this.sessions.prepareEvidence?.(sessionId)
    const key = await this.key(sessionId, evidenceId, true)
    const body = this.cipher.encrypt(
      { contentType: image.contentType, bytes: Buffer.from(image.bytes).toString('base64') },
      key,
    )
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: 'application/octet-stream',
          CacheControl: 'no-store',
          ServerSideEncryption: 'AES256',
        }),
        { abortSignal: AbortSignal.timeout(30_000) },
      )
    } catch {
      throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
    }
  }

  async load(sessionId: string, evidenceId: string): Promise<CapturedImage | null> {
    const key = await this.key(sessionId, evidenceId)
    try {
      const object = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { abortSignal: AbortSignal.timeout(30_000) },
      )
      if (!object.Body) return null
      const payload = this.cipher.decrypt<EncryptedPhoto>(
        await object.Body.transformToString(),
        key,
      )
      await this.key(sessionId, evidenceId)
      // Never return a presigned URL; evidence bytes always pass the current backend authorization.
      return {
        bytes: new Uint8Array(Buffer.from(payload.bytes, 'base64')),
        contentType: payload.contentType,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'NoSuchKey') return null
      if (error instanceof FaceCheckError) throw error
      throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
    }
  }
}
