import { randomUUID } from 'node:crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'

import { getS3Client, getUploadsBucketName } from '@server/shared/storage/s3-client'
import { sanitizeUploadFilename } from '@server/shared/storage/sanitize-filename'
import type { AvatarStorage } from '../application/ports/avatar-storage.port'
import type { AvatarStorageInput, StoredAvatar } from '../types/avatar'

export class S3AvatarStorage implements AvatarStorage {
  async upload(input: AvatarStorageInput): Promise<StoredAvatar> {
    const key = `avatars/${input.tenantId}/${input.userId}/${randomUUID()}-${sanitizeUploadFilename(input.filename)}`
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: getUploadsBucketName(),
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    )
    return { url: `/api/auth/media/${key}`, contentType: input.contentType }
  }
}
