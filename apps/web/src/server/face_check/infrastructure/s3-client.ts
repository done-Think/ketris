import { S3Client } from '@aws-sdk/client-s3'
import { FaceCheckError } from '../http/errors'

let client: S3Client | undefined

export function getFaceCheckS3Client() {
  if (client) return client
  const region = process.env.AWS_REGION
  if (!region) throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
  client = new S3Client({ region, maxAttempts: 2 })
  return client
}
