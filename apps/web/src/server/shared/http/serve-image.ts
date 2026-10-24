import { GetObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

import { getS3Client, getUploadsBucketName } from '../storage/s3-client'

export async function serveStoredImage(key: string): Promise<NextResponse> {
  try {
    const object = await getS3Client().send(
      new GetObjectCommand({ Bucket: getUploadsBucketName(), Key: key }),
    )
    const body = await object.Body?.transformToByteArray()
    if (!body) return new NextResponse(null, { status: 404 })
    return new NextResponse(Buffer.from(body), {
      headers: {
        'Content-Type': object.ContentType ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchKey')
      return new NextResponse(null, { status: 404 })
    throw error
  }
}
