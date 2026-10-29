import { S3Client } from '@aws-sdk/client-s3'

let cachedClient: S3Client | null = null

export function hasUploadsStorageConfig(): boolean {
  return Boolean(
    process.env.AWS_REGION &&
    process.env.S3_BUCKET_NAME &&
    (process.env.NODE_ENV === 'production' ||
      (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
      process.env.AWS_PROFILE ||
      process.env.AWS_WEB_IDENTITY_TOKEN_FILE ||
      process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
      process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI),
  )
}

export function shouldUseLocalUploadsStorage(): boolean {
  return process.env.NODE_ENV !== 'production' && !hasUploadsStorageConfig()
}

export function getS3Client(): S3Client {
  if (cachedClient) {
    return cachedClient
  }

  const region = process.env.AWS_REGION
  if (!region) {
    throw new Error('AWS_REGION não configurado.')
  }

  // The SDK chain supports temporary session tokens, profiles and workload roles.
  cachedClient = new S3Client({ region })

  return cachedClient
}

export function getUploadsBucketName(): string {
  const bucketName = process.env.S3_BUCKET_NAME

  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME não configurado.')
  }

  return bucketName
}
