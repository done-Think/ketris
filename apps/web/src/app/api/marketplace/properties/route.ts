import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { searchPropertiesQuerySchema } from '@server/marketplace/schemas/search-properties.schema'
import { RequestValidationError, withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const rawQuery = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = searchPropertiesQuerySchema.safeParse(rawQuery)

  if (!parsed.success) {
    throw new RequestValidationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    )
  }

  const properties = await marketplaceContainer.searchPropertiesUseCase.execute(parsed.data)

  return NextResponse.json({ properties }, { status: 200 })
})
