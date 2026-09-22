import { S3Client } from '@aws-sdk/client-s3'

let cachedClient: S3Client | null = null

export function getS3Client(): S3Client {
  if (cachedClient) {
    return cachedClient
  }

  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Credenciais da AWS não configuradas (AWS_REGION/AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY).',
    )
  }

  cachedClient = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })

  return cachedClient
}

export function getUploadsBucketName(): string {
  const bucketName = process.env.S3_BUCKET_NAME

  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME não configurado.')
  }

  return bucketName
}
