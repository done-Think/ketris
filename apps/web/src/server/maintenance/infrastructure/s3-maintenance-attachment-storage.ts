import { randomUUID } from 'node:crypto'

import { PutObjectCommand } from '@aws-sdk/client-s3'

import { getS3Client, getUploadsBucketName } from '@server/shared/storage/s3-client'

import type {
  MaintenanceAttachmentStoragePort,
  UploadedMaintenanceAttachment,
  UploadMaintenanceAttachmentInput,
} from '../types/maintenance-attachment-storage'

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

    return { url: `/api/maintenance/media/${key}`, contentType: input.contentType }
  }
}
