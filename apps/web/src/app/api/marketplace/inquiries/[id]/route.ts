import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import type { InquiryUpdate } from '@server/marketplace/domain/inquiry.entity'
import { marketplaceContainer } from '@server/marketplace/container'
import { deleteInquiryQuerySchema } from '@server/marketplace/schemas/delete-inquiry.schema'
import {
  patchInquiryRequestSchema,
  putInquiryRequestSchema,
} from '@server/marketplace/schemas/update-inquiry.schema'
import { parseJsonBody, RequestValidationError, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const inquiry = await marketplaceContainer.getInquiryUseCase.execute({
    actorTenantId: actor.tenantId,
    inquiryId: (await context.params).id,
  })

  return NextResponse.json({ inquiry }, { status: 200 })
})

export const PUT = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, putInquiryRequestSchema)

  const changes: InquiryUpdate = {
    interessadoNome: body.interessadoNome,
    interessadoEmail: body.interessadoEmail,
    interessadoTelefone: body.interessadoTelefone ?? null,
    valorProposto: body.valorProposto,
    prazoContratoMeses: body.prazoContratoMeses ?? null,
    inicioPretendido: body.inicioPretendido ?? null,
    garantiaContratual: body.garantiaContratual ?? 'NENHUMA',
    condicoesEspeciais: body.condicoesEspeciais ?? [],
    observacoes: body.observacoes ?? null,
    status: body.status,
  }

  const inquiry = await marketplaceContainer.updateInquiryUseCase.execute({
    actorTenantId: actor.tenantId,
    inquiryId: (await context.params).id,
    changes,
  })

  return NextResponse.json({ inquiry }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, patchInquiryRequestSchema)

  const inquiry = await marketplaceContainer.updateInquiryUseCase.execute({
    actorTenantId: actor.tenantId,
    inquiryId: (await context.params).id,
    changes: body,
  })

  return NextResponse.json({ inquiry }, { status: 200 })
})

export const DELETE = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const parsed = deleteInquiryQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )

  if (!parsed.success) {
    throw new RequestValidationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    )
  }

  if (parsed.data.permanent) {
    await marketplaceContainer.deleteInquiryUseCase.execute({
      actorTenantId: actor.tenantId,
      inquiryId: (await context.params).id,
    })

    return new NextResponse(null, { status: 204 })
  }

  const inquiry = await marketplaceContainer.archiveInquiryUseCase.execute({
    actorTenantId: actor.tenantId,
    inquiryId: (await context.params).id,
  })

  return NextResponse.json({ inquiry }, { status: 200 })
})
