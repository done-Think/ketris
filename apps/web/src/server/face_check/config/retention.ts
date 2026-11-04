import { FaceCheckError } from '../http/errors'

export function requireEvidenceRetentionConfiguration() {
  if (process.env.NODE_ENV !== 'production') return
  const secret = process.env.FACE_CHECK_RETENTION_SECRET ?? process.env.CRON_SECRET
  if (!secret || Buffer.byteLength(secret) < 32)
    throw new FaceCheckError('EVIDENCE_RETENTION_NOT_CONFIGURED', 503)
}
