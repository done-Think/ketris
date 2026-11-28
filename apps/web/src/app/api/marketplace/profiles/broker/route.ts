import { resolveActorAccountType } from '@server/auth/resolve-actor-account-type'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import { saveBrokerProfileRequestSchema } from '@server/marketplace/schemas/broker-profile.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const profile = await marketplaceContainer.getOwnBrokerProfileUseCase.execute({
    actorId: actor.sub,
    actorRole: actor.role,
    actorAccountType: await resolveActorAccountType(actor.sub),
  })

  return NextResponse.json({ profile }, { status: 200 })
})

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, saveBrokerProfileRequestSchema)

  const profile = await marketplaceContainer.saveBrokerProfileUseCase.execute({
    actorId: actor.sub,
    actorRole: actor.role,
    actorAccountType: await resolveActorAccountType(actor.sub),
    displayName: body.displayName,
    headline: body.headline ?? null,
    summary: body.summary ?? null,
    creci: body.creci ?? null,
    phone: body.phone ?? null,
    region: body.region ?? null,
    coverage: body.coverage,
    segments: body.segments,
    availability: body.availability ?? null,
    primaryColor: body.primaryColor ?? null,
    secondaryColor: body.secondaryColor ?? null,
    backgroundColor: body.backgroundColor ?? null,
    avatarUrl: body.avatarUrl ?? null,
    bannerUrl: body.bannerUrl ?? null,
  })

  return NextResponse.json({ profile }, { status: 200 })
})
