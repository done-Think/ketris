import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import { saveAgencyProfileRequestSchema } from '@server/marketplace/schemas/agency-profile.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const profile = await marketplaceContainer.getOwnAgencyProfileUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
  })

  return NextResponse.json({ profile }, { status: 200 })
})

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, saveAgencyProfileRequestSchema)

  const profile = await marketplaceContainer.saveAgencyProfileUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    displayName: body.displayName,
    headline: body.headline ?? null,
    summary: body.summary ?? null,
    legalCreci: body.legalCreci ?? null,
    headquarters: body.headquarters ?? null,
    address: body.address ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
    coverage: body.coverage,
    segments: body.segments,
    yearsInMarket: body.yearsInMarket ?? null,
    backgroundColor: body.backgroundColor ?? null,
    logoUrl: body.logoUrl ?? null,
    bannerUrl: body.bannerUrl ?? null,
    team: body.team,
  })

  return NextResponse.json({ profile }, { status: 200 })
})
