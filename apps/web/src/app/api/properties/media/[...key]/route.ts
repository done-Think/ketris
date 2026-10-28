import { propertyMediaSegmentsSchema } from '@server/properties/schemas/property.schema'
import type { PropertyMediaRouteContext } from '@server/properties/types/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { serveStoredImage } from '@server/shared/http/serve-image'
import { withErrorHandling } from '@server/shared/http'
import { shouldUseLocalUploadsStorage } from '@server/shared/storage/s3-client'
import {
  readLocalUpload,
  getContentTypeFromMediaKey,
} from '@server/shared/storage/local-media-storage'
import { propertyMediaStorageError } from '@server/properties/infrastructure/property-media-storage-error'

export const GET = withErrorHandling(
  async (_request: NextRequest, context: PropertyMediaRouteContext) => {
    const { key } = await context.params
    if (!propertyMediaSegmentsSchema.safeParse(key).success)
      return new NextResponse(null, { status: 404 })

    const objectKey = key.join('/')

    try {
      if (shouldUseLocalUploadsStorage()) {
        const body = await readLocalUpload('properties', objectKey)
        return new NextResponse(Buffer.from(body), {
          headers: {
            'Content-Type': getContentTypeFromMediaKey(objectKey),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      }
      return await serveStoredImage(objectKey)
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        ['ENOENT', 'ENOTDIR'].includes(String(error.code))
      ) {
        return new NextResponse(null, { status: 404 })
      }
      throw propertyMediaStorageError(error)
    }
  },
)
