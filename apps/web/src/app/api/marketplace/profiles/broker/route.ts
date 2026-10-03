import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import { saveBrokerProfileRequestSchema } from '@server/marketplace/schemas/broker-profile.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const profile = await marketplaceContainer.getOwnBrokerProfileUseCase.execute({
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
  })

  return NextResponse.json({ profile }, { status: 200 })
})

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, saveBrokerProfileRequestSchema)

  const profile = await marketplaceContainer.saveBrokerProfileUseCase.execute({
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
    displayName: body.displayName,
    headline: body.headline ?? null,
    bio: body.bio ?? null,
    creci: body.creci ?? null,
    phone: body.phone ?? null,
    region: body.region ?? null,
    neighborhoods: body.neighborhoods,
    specialties: body.specialties,
    availability: body.availability ?? null,
    primaryColor: body.primaryColor ?? null,
    secondaryColor: body.secondaryColor ?? null,
    backgroundColor: body.backgroundColor ?? null,
    avatarUrl: body.avatarUrl ?? null,
    bannerUrl: body.bannerUrl ?? null,
  })

  return NextResponse.json({ profile }, { status: 200 })
})
