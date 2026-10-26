import { randomUUID } from 'node:crypto'

import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

import { getS3Client, getUploadsBucketName } from '@server/shared/storage/s3-client'

import type {
  MaintenanceAttachmentStoragePort,
  UploadedMaintenanceAttachment,
  UploadMaintenanceAttachmentInput,
} from '../application/ports/maintenance-attachment-storage.port'
import { MAINTENANCE_MEDIA_URL_PREFIX } from '../domain/maintenance-attachment-rules'
import type { MaintenanceAttachmentObject } from '../types/maintenance-ticket'

function sanitizeFilename(filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

  return sanitized.slice(-100)
}

export class S3MaintenanceAttachmentStorage implements MaintenanceAttachmentStoragePort {
  async upload(input: UploadMaintenanceAttachmentInput): Promise<UploadedMaintenanceAttachment> {
    const key = `maintenance/${input.tenantId}/${randomUUID()}-${sanitizeFilename(input.filename)}`

    await getS3Client().send(
      new PutObjectCommand({
        Bucket: getUploadsBucketName(),
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    )

    return { url: `${MAINTENANCE_MEDIA_URL_PREFIX}${key}`, contentType: input.contentType }
  }

  async download(objectKey: string): Promise<MaintenanceAttachmentObject | null> {
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
