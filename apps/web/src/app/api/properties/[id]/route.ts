import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
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
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
    id: (await context.params).id,
  })

  return NextResponse.json({ property }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, updatePropertyRequestSchema)

  const property = await propertiesContainer.updatePropertyUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    id: (await context.params).id,
    actorPapel: actor.papel as Papel,
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

  await propertiesContainer.deletePropertyUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    id: (await context.params).id,
    actorPapel: actor.papel as Papel,
  })

  return new NextResponse(null, { status: 204 })
})
