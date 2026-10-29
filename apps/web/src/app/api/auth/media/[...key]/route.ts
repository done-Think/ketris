import { avatarMediaSegmentsSchema } from '@server/auth/schemas/avatar.schema'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { AvatarMediaRouteContext } from '@server/auth/types/route-context'
import { withErrorHandling } from '@server/shared/http'
import { serveStoredImage } from '@server/shared/http/serve-image'

export const GET = withErrorHandling(
  async (_request: NextRequest, context: AvatarMediaRouteContext) => {
    const { key } = await context.params
    if (!avatarMediaSegmentsSchema.safeParse(key).success)
      return new NextResponse(null, { status: 404 })
    return serveStoredImage(key.join('/'))
  },
)
