import { propertyIdParamsSchema } from '@server/properties/schemas/property.schema'
import type { PropertyRouteContext } from '@server/properties/types/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { propertiesContainer } from '@server/properties/container'
import { updatePropertyRequestSchema } from '@server/properties/schemas/property-input.schema'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: PropertyRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, propertyIdParamsSchema)

    const property = await propertiesContainer.getPropertyUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorPapel: actor.papel as Papel,
      id,
    })

    return NextResponse.json({ property }, { status: 200 })
  },
)

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: PropertyRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, propertyIdParamsSchema)
    const body = await parseJsonBody(request, updatePropertyRequestSchema)

    const property = await propertiesContainer.updatePropertyUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      id,
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
  },
)

export const DELETE = withErrorHandling(
  async (request: NextRequest, context: PropertyRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, propertyIdParamsSchema)

    await propertiesContainer.deletePropertyUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      id,
      actorPapel: actor.papel as Papel,
    })

    return new NextResponse(null, { status: 204 })
  },
)
