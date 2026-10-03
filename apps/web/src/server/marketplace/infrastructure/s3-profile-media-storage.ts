import { randomUUID } from 'node:crypto'

import { PutObjectCommand } from '@aws-sdk/client-s3'

import { getS3Client, getUploadsBucketName } from '@server/shared/storage/s3-client'

import type {
  ProfileMediaStoragePort,
  UploadedProfileMedia,
  UploadProfileMediaInput,
} from '../application/ports/profile-media-storage.port'

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

    // Bucket privado (ver infra/terraform/s3.tf) — a URL devolvida aponta pra rota própria que faz
    // proxy do objeto (GET /api/marketplace/media/[...key]), nunca pro S3 direto.
    return { url: `/api/marketplace/media/${key}`, contentType: input.contentType }
  }
}
