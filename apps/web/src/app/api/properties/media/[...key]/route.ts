import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'

import { getS3Client, getUploadsBucketName } from '@server/shared/storage/s3-client'
import { withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ key: string[] }>
}

// Sem `requireBearerAuth` de propósito: um <img src> não consegue mandar o header Authorization,
// e o bucket é privado (sem CORS/policy pública, ver infra/terraform/s3.tf), então essa rota é o
// único jeito de servir a mídia. A chave do objeto inclui um UUID aleatório (ver
// S3PropertyMediaStorage), então não dá pra enumerar/adivinhar — a mesma lógica de "link não
// listado" que protege um objeto público de verdade.
export const GET = withErrorHandling(async (_request: NextRequest, context: RouteContext) => {
  const { key } = await context.params
  const objectKey = key.join('/')

  try {
    const object = await getS3Client().send(
      new GetObjectCommand({ Bucket: getUploadsBucketName(), Key: objectKey }),
    )
    const body = await object.Body?.transformToByteArray()

    if (!body) {
      return new NextResponse(null, { status: 404 })
    }

    return new NextResponse(Buffer.from(body), {
      status: 200,
      headers: {
        'Content-Type': object.ContentType ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return new NextResponse(null, { status: 404 })
    }

    throw error
  }
})
