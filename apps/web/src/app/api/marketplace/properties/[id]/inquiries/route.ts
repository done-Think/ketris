import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { InquiryQuotaExceededError } from '@server/marketplace/domain/errors'
import { marketplaceContainer } from '@server/marketplace/container'
import { marketplaceIdParamsSchema } from '@server/marketplace/schemas/route-params.schema'
import type { MarketplaceIdRouteContext } from '@server/marketplace/types/http'
import { submitInquiryRequestSchema } from '@server/marketplace/schemas/submit-inquiry.schema'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: MarketplaceIdRouteContext) => {
    const { id } = await parseRouteParams(context.params, marketplaceIdParamsSchema)
    const body = await parseJsonBody(request, submitInquiryRequestSchema)

    try {
      const inquiry = await marketplaceContainer.submitInquiryUseCase.execute({
        website: body.website,
        propertyId: id,
        leadName: body.leadName,
        leadEmail: body.leadEmail,
        leadPhone: body.leadPhone,
        proposedValue: body.proposedValue,
        notes: body.notes,
      })

      return NextResponse.json({ inquiry }, { status: 201 })
    } catch (error) {
      if (error instanceof InquiryQuotaExceededError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          {
            status: 429,
            headers: { 'Retry-After': String(error.retryAfter), 'Cache-Control': 'no-store' },
          },
        )
      }
      throw error
    }
  },
)
