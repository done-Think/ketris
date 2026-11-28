import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getS3Client, getUploadsBucketName } from '@server/shared/storage/s3-client'
import { instagramContainer } from '@server/instagram/container'
import { mediaSignature, safeEqual } from '@server/instagram/infrastructure/token-vault'
import type { InstagramMediaContext } from '@server/instagram/types/http'

export const runtime = 'nodejs'
export async function GET(request: NextRequest, context: InstagramMediaContext) {
  try {
    const { id, index } = await context.params
    const expires = request.nextUrl.searchParams.get('expires') ?? ''
    const signature = request.nextUrl.searchParams.get('signature') ?? ''
    const expiry = Number(expires)
    if (
      !/^\d+$/.test(index) ||
      !Number.isFinite(expiry) ||
      expiry <= Date.now() / 1000 ||
      expiry > Date.now() / 1000 + 48 * 3600 ||
      !safeEqual(signature, mediaSignature(`${id}/${Number(index)}/${expires}`))
    )
      throw new Error()
    const job = await instagramContainer.repository.publication(id)
    const key = job?.preparedKeys[Number(index)]
    if (!job || !key || job.status === 'CANCELLED') throw new Error()
    const object = await getS3Client().send(
      new GetObjectCommand({ Bucket: getUploadsBucketName(), Key: key }),
    )
    const body = await object.Body?.transformToByteArray()
    if (!body) throw new Error()
    return new NextResponse(Buffer.from(body), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
