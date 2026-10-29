import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { propertiesContainer } from '@server/properties/container'
import {
  createPropertyRequestSchema,
  listPropertiesQuerySchema,
} from '@server/properties/schemas/property-input.schema'
import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const query = parseQuery(request, listPropertiesQuerySchema)

  const properties = await propertiesContainer.listPropertiesUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorRole: actor.role,
    locale: query.locale,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    purpose: query.purpose,
  })

  return NextResponse.json(properties, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createPropertyRequestSchema)

  const property = await propertiesContainer.createPropertyUseCase.execute({
    actorTenantId: actor.tenantId,
    actorUserId: actor.sub,
    actorRole: actor.role,
    ownerId: body.ownerId,
    title: body.title,
    description: body.description ?? null,
    purpose: body.purpose,
    type: body.type,
    listing: body.listing,
    bedrooms: body.bedrooms ?? null,
    bathrooms: body.bathrooms ?? null,
    parkingSpots: body.parkingSpots ?? null,
    areaSqm: body.areaSqm ?? null,
    price: body.price,
    rentalPrice: body.rentalPrice ?? null,
    condoFee: body.condoFee ?? null,
    propertyTax: body.propertyTax ?? null,
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
    media: body.media,
  })

  return NextResponse.json({ property }, { status: 201 })
})
