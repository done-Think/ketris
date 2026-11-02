import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { FaceCheckError } from '../http/errors'
import type { CapturedImage } from '../types/face-match.types'
import type { PhotoStore, SessionRepository } from '../types/verification.types'
import { captureTokenHash, DataCipher } from './data-cipher'
import { evidenceUnavailable } from '../verification/domain/evidence-policy'

export class LocalPhotoStore implements PhotoStore {
  constructor(
    private readonly tenantId: string,
    private readonly cipher: DataCipher,
    private readonly sessions: SessionRepository,
    private readonly root = resolve(process.cwd(), '.local/face_check'),
  ) {
    if (process.env.NODE_ENV === 'production') throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
  }

  private async path(sessionId: string, evidenceId: string, writing = false) {
    if (process.env.NODE_ENV === 'production') throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
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
    return resolve(this.root, captureTokenHash(this.tenantId), sessionId, `${evidenceId}.enc`)
  }

  async save(sessionId: string, evidenceId: string, image: CapturedImage) {
    await this.sessions.prepareEvidence?.(sessionId)
    const path = await this.path(sessionId, evidenceId, true)
    await mkdir(resolve(path, '..'), { recursive: true, mode: 0o700 })
    await writeFile(
      path,
      this.cipher.encrypt(
        { contentType: image.contentType, bytes: Buffer.from(image.bytes).toString('base64') },
        `photo:${this.tenantId}:${sessionId}:${evidenceId}`,
      ),
      { mode: 0o600 },
    )
  }

  async load(sessionId: string, evidenceId: string): Promise<CapturedImage | null> {
    const path = await this.path(sessionId, evidenceId)
    try {
      const value = this.cipher.decrypt<{ contentType: string; bytes: string }>(
        await readFile(path, 'utf8'),
        `photo:${this.tenantId}:${sessionId}:${evidenceId}`,
      )
      await this.path(sessionId, evidenceId)
      return {
        contentType: value.contentType,
        bytes: new Uint8Array(Buffer.from(value.bytes, 'base64')),
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
        return null
      throw error
    }
  }
}
