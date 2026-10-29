import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { AppError } from '@server/shared/errors'
import { getS3Client, getUploadsBucketName } from '@server/shared/storage/s3-client'
import { sanitizeUploadFilename } from '@server/shared/storage/sanitize-filename'
import { randomUUID } from 'node:crypto'
import type {
  MaintenanceAttachmentReaderPort,
  MaintenanceAttachmentStoragePort,
} from '../application/ports/maintenance-attachment-storage.port'
import type { MaintenanceDirectUploadStorage } from '../application/ports/maintenance-direct-upload.port'
import {
  MAINTENANCE_ATTACHMENT_DOWNLOAD_TTL_SECONDS,
  MAINTENANCE_ATTACHMENT_UPLOAD_TTL_SECONDS,
} from '../config/attachment-limits'
import { MaintenanceAttachmentValidationError } from '../domain/errors'
import type {
  DownloadedMaintenanceAttachment,
  UploadedMaintenanceAttachment,
  UploadMaintenanceAttachmentInput,
} from '../types/maintenance-attachment-storage'
import type { MaintenanceUploadDescriptor } from '../types/maintenance-upload'

export class S3MaintenanceAttachmentStorage
  implements
    MaintenanceAttachmentStoragePort,
    MaintenanceAttachmentReaderPort,
    MaintenanceDirectUploadStorage
{
  private async access<T>(
    work: (client: ReturnType<typeof getS3Client>, bucket: string) => Promise<T>,
  ): Promise<T> {
    try {
      return await work(getS3Client(), getUploadsBucketName())
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('Serviço de anexos indisponível.', {
        status: 503,
        code: 'MAINTENANCE_STORAGE_UNAVAILABLE',
      })
    }
  }

  download(key: string): Promise<DownloadedMaintenanceAttachment | null> {
    return this.access(async (client, bucket) => {
      try {
        const metadata = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
        const url = await getSignedUrl(
          client,
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseCacheControl: 'private, no-store',
            ResponseContentType: metadata.ContentType ?? 'application/octet-stream',
          }),
          { expiresIn: MAINTENANCE_ATTACHMENT_DOWNLOAD_TTL_SECONDS },
        )
        return { url }
      } catch (error) {
        if (error instanceof Error && ['NoSuchKey', 'NotFound'].includes(error.name)) return null
        throw error
      }
    })
  }

  uploadLocation(key: string, descriptor: MaintenanceUploadDescriptor) {
    return this.access(async (client, bucket) => {
      const checksum = Buffer.from(descriptor.sha256, 'hex').toString('base64')
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: descriptor.contentType,
          ContentLength: descriptor.size,
          ChecksumSHA256: checksum,
        }),
        {
          expiresIn: MAINTENANCE_ATTACHMENT_UPLOAD_TTL_SECONDS,
          unhoistableHeaders: new Set(['x-amz-checksum-sha256']),
          signableHeaders: new Set(['content-type', 'content-length']),
        },
      )
      return {
        url,
        headers: { 'Content-Type': descriptor.contentType, 'x-amz-checksum-sha256': checksum },
      }
    })
  }

  inspect(key: string) {
    return this.access(async (client, bucket) => {
      try {
        const metadata = await client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key, ChecksumMode: 'ENABLED' }),
        )
        return {
          size: metadata.ContentLength ?? 0,
          contentType: metadata.ContentType ?? null,
          sha256: metadata.ChecksumSHA256
            ? Buffer.from(metadata.ChecksumSHA256, 'base64').toString('hex')
            : null,
        }
      } catch (error) {
        if (error instanceof Error && ['NoSuchKey', 'NotFound'].includes(error.name))
          throw new MaintenanceAttachmentValidationError('O arquivo enviado não foi encontrado.')
        throw error
      }
    })
  }

  upload(input: UploadMaintenanceAttachmentInput): Promise<UploadedMaintenanceAttachment> {
    return this.access(async (client, bucket) => {
      const key = `maintenance/${input.tenantId}/${randomUUID()}-${sanitizeUploadFilename(input.filename)}`
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: input.body,
          ContentType: input.contentType,
        }),
      )
      return { url: `/api/maintenance/media/${key}`, contentType: input.contentType }
    })
  }
}
