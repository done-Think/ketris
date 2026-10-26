import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { AppError } from '@server/shared/errors'
import { getS3Client, getUploadsBucketName } from '@server/shared/storage/s3-client'
import { sanitizeUploadFilename } from '@server/shared/storage/sanitize-filename'

import type { ChargeReceiptStorage } from '../application/ports/charge-receipt-storage.port'
import {
  CHARGE_RECEIPT_DOWNLOAD_TTL_SECONDS,
  CHARGE_RECEIPT_SIGNATURE_BYTES,
  CHARGE_RECEIPT_UPLOAD_TTL_SECONDS,
} from '../config/receipt-limits'
import { ChargeReceiptNotFoundError, ChargeReceiptStorageUnavailableError } from '../domain/errors'
import type { ChargeReceiptDescriptor } from '../types/charge-receipt'

export class S3ChargeReceiptStorage implements ChargeReceiptStorage {
  constructor(
    private readonly client?: S3Client,
    private readonly bucket?: string,
  ) {}

  private async access<T>(work: (client: S3Client, bucket: string) => Promise<T>): Promise<T> {
    try {
      return await work(this.client ?? getS3Client(), this.bucket ?? getUploadsBucketName())
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof Error && ['NoSuchKey', 'NotFound'].includes(error.name))
        throw new ChargeReceiptNotFoundError()
      throw new ChargeReceiptStorageUnavailableError()
    }
  }

  uploadLocation(key: string, descriptor: ChargeReceiptDescriptor) {
    return this.access(async (client, bucket) => {
      const checksum = Buffer.from(descriptor.sha256, 'hex').toString('base64')
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: descriptor.contentType,
        ContentLength: descriptor.size,
        ChecksumSHA256: checksum,
      })
      const url = await getSignedUrl(client, command, {
        expiresIn: CHARGE_RECEIPT_UPLOAD_TTL_SECONDS,
        unhoistableHeaders: new Set(['x-amz-checksum-sha256']),
        signableHeaders: new Set(['content-type', 'content-length']),
      })

      return {
        url,
        headers: { 'Content-Type': descriptor.contentType, 'x-amz-checksum-sha256': checksum },
      }
    })
  }

  inspect(key: string) {
    return this.access(async (client, bucket) => {
      const metadata = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key, ChecksumMode: 'ENABLED' }),
      )
      const prefix = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          Range: `bytes=0-${CHARGE_RECEIPT_SIGNATURE_BYTES - 1}`,
        }),
      )
      const bytes = await prefix.Body?.transformToByteArray()

      return {
        size: metadata.ContentLength ?? 0,
        contentType: metadata.ContentType ?? null,
        sha256: metadata.ChecksumSHA256
          ? Buffer.from(metadata.ChecksumSHA256, 'base64').toString('hex')
          : null,
        signature: bytes ?? new Uint8Array(),
      }
    })
  }

  downloadUrl(key: string, name: string, contentType: string) {
    return this.access((client, bucket) =>
      getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          ResponseContentDisposition: `attachment; filename="${sanitizeUploadFilename(name) || 'comprovante'}"`,
          ResponseCacheControl: 'private, no-store',
          ResponseContentType: contentType,
        }),
        { expiresIn: CHARGE_RECEIPT_DOWNLOAD_TTL_SECONDS },
      ),
    )
  }
}
