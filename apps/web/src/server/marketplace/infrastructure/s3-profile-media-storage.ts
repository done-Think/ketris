import { randomUUID } from 'node:crypto'

import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

import { getS3Client, getUploadsBucketName } from '@server/shared/storage/s3-client'

import type { ProfileMediaStoragePort } from '../application/ports/profile-media-storage.port'
import type {
  StoredProfileMedia,
  UploadedProfileMedia,
  UploadProfileMediaInput,
} from '../types/profile-media'

function sanitizeFilename(filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

  return sanitized.slice(-100)
}

export class S3ProfileMediaStorage implements ProfileMediaStoragePort {
  async upload(input: UploadProfileMediaInput): Promise<UploadedProfileMedia> {
    const key = `${input.keyPrefix}${randomUUID()}-${sanitizeFilename(input.filename)}`

    await getS3Client().send(
      new PutObjectCommand({
        Bucket: getUploadsBucketName(),
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    )

    return { url: `/api/marketplace/media/${key}`, contentType: input.contentType }
  }

  async read(objectKey: string): Promise<StoredProfileMedia | null> {
    try {
      const object = await getS3Client().send(
        new GetObjectCommand({ Bucket: getUploadsBucketName(), Key: objectKey }),
      )
      const body = await object.Body?.transformToByteArray()

      return body ? { body, contentType: object.ContentType ?? 'application/octet-stream' } : null
    } catch (error) {
      if (error instanceof Error && error.name === 'NoSuchKey') return null
      throw error
    }
  }
}
