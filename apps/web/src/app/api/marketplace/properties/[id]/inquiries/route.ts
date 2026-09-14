import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { submitInquiryRequestSchema } from '@server/marketplace/schemas/submit-inquiry.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const body = await parseJsonBody(request, submitInquiryRequestSchema)

  const inquiry = await marketplaceContainer.submitInquiryUseCase.execute({
    propertyId: (await context.params).id,
    interessadoNome: body.interessadoNome,
    interessadoEmail: body.interessadoEmail,
    interessadoTelefone: body.interessadoTelefone,
    valorProposto: body.valorProposto,
    observacoes: body.observacoes,
  })

  return NextResponse.json({ inquiry }, { status: 201 })
})
