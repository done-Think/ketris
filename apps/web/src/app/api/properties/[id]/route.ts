import { propertyIdParamsSchema } from '@server/properties/schemas/property.schema'
import type { PropertyRouteContext } from '@server/properties/types/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
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
      actorRole: actor.role,
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
      actorRole: actor.role,
      ...body,
      address: body.address
        ? {
            street: body.address.street,
            number: body.address.number,
            complement: body.address.complement ?? null,
            neighborhood: body.address.neighborhood,
            city: body.address.city,
            state: body.address.state,
            zipCode: body.address.zipCode,
            latitude: body.address.latitude ?? null,
            longitude: body.address.longitude ?? null,
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
      actorRole: actor.role,
    })

    return new NextResponse(null, { status: 204 })
  },
)
