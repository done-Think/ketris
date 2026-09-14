import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { propertiesContainer } from '@server/properties/container'
import { updatePropertyRequestSchema } from '@server/properties/schemas/property-input.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const property = await propertiesContainer.getPropertyUseCase.execute({
    actorTenantId: actor.tenantId,
    id: (await context.params).id,
  })

  return NextResponse.json({ property }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, updatePropertyRequestSchema)

  const property = await propertiesContainer.updatePropertyUseCase.execute({
    actorTenantId: actor.tenantId,
    id: (await context.params).id,
    ...body,
    endereco: body.endereco
      ? {
          logradouro: body.endereco.logradouro,
          numero: body.endereco.numero,
          complemento: body.endereco.complemento ?? null,
          bairro: body.endereco.bairro,
          cidade: body.endereco.cidade,
          estado: body.endereco.estado,
          cep: body.endereco.cep,
          latitude: body.endereco.latitude ?? null,
          longitude: body.endereco.longitude ?? null,
        }
      : undefined,
  })

  return NextResponse.json({ property }, { status: 200 })
})

export const DELETE = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const property = await propertiesContainer.deactivatePropertyUseCase.execute({
    actorTenantId: actor.tenantId,
    id: (await context.params).id,
  })

  return NextResponse.json({ property }, { status: 200 })
})
