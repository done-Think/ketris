import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { marketplaceIdParamsSchema } from '@server/marketplace/schemas/route-params.schema'
import type { MarketplaceIdRouteContext } from '@server/marketplace/types/http'
import { submitInquiryRequestSchema } from '@server/marketplace/schemas/submit-inquiry.schema'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: MarketplaceIdRouteContext) => {
    const { id } = await parseRouteParams(context.params, marketplaceIdParamsSchema)
    const body = await parseJsonBody(request, submitInquiryRequestSchema)

    const inquiry = await marketplaceContainer.submitInquiryUseCase.execute({
      propertyId: id,
      leadName: body.leadName,
      leadEmail: body.leadEmail,
      leadPhone: body.leadPhone,
      proposedValue: body.proposedValue,
      notes: body.notes,
    })

    return NextResponse.json({ inquiry }, { status: 201 })
  },
)
