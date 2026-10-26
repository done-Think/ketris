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
import type { ContractDocumentStorage } from '../application/ports/contract-document-storage.port'
import type { ContractDocumentDescriptor } from '../types/documents'
import {
  CONTRACT_DOCUMENT_CONTENT_TYPE,
  CONTRACT_DOCUMENT_DOWNLOAD_TTL_SECONDS,
  CONTRACT_DOCUMENT_UPLOAD_TTL_SECONDS,
} from '../config/document-limits'
import { ContractDocumentNotFoundError } from '../domain/errors'

export class S3ContractDocumentStorage implements ContractDocumentStorage {
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
        throw new ContractDocumentNotFoundError()
      throw new AppError('Serviço de documentos indisponível.', {
        status: 503,
        code: 'CONTRACT_DOCUMENT_STORAGE_UNAVAILABLE',
      })
    }
  }

  uploadLocation(key: string, descriptor: ContractDocumentDescriptor) {
    return this.access(async (client, bucket) => {
      const checksum = Buffer.from(descriptor.sha256, 'hex').toString('base64')
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: CONTRACT_DOCUMENT_CONTENT_TYPE,
        ContentLength: descriptor.size,
        ChecksumSHA256: checksum,
      })
      const url = await getSignedUrl(client, command, {
        expiresIn: CONTRACT_DOCUMENT_UPLOAD_TTL_SECONDS,
        unhoistableHeaders: new Set(['x-amz-checksum-sha256']),
        signableHeaders: new Set(['content-type', 'content-length']),
      })
      return {
        url,
        headers: {
          'Content-Type': CONTRACT_DOCUMENT_CONTENT_TYPE,
          'x-amz-checksum-sha256': checksum,
        },
      }
    })
  }

  inspect(key: string) {
    return this.access(async (client, bucket) => {
      const metadata = await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
          ChecksumMode: 'ENABLED',
        }),
      )
      const prefix = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          Range: 'bytes=0-4',
        }),
      )
      const bytes = await prefix.Body?.transformToByteArray()
      return {
        size: metadata.ContentLength ?? 0,
        contentType: metadata.ContentType ?? null,
        sha256: metadata.ChecksumSHA256
          ? Buffer.from(metadata.ChecksumSHA256, 'base64').toString('hex')
          : null,
        pdf: Boolean(bytes && Buffer.from(bytes).toString('ascii') === '%PDF-'),
      }
    })
  }

  downloadUrl(key: string, name: string) {
    return this.access((client, bucket) =>
      getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          ResponseContentDisposition:
            'attachment; filename="' + (sanitizeUploadFilename(name) || 'contrato.pdf') + '"',
          ResponseCacheControl: 'private, no-store',
          ResponseContentType: CONTRACT_DOCUMENT_CONTENT_TYPE,
        }),
        { expiresIn: CONTRACT_DOCUMENT_DOWNLOAD_TTL_SECONDS },
      ),
    )
  }
}
