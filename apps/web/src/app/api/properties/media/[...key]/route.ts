import { propertyMediaSegmentsSchema } from '@server/properties/schemas/property.schema'
import type { PropertyMediaRouteContext } from '@server/properties/types/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { serveStoredImage } from '@server/shared/http/serve-image'
import { withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (_request: NextRequest, context: PropertyMediaRouteContext) => {
    const { key } = await context.params
    if (!propertyMediaSegmentsSchema.safeParse(key).success)
      return new NextResponse(null, { status: 404 })

    const objectKey = key.join('/')

    return serveStoredImage(objectKey)
  },
)
