import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'
import { teamContainer } from '@server/team/container'
import { inviteBrokerRequestSchema } from '@server/team/schemas/team.schema'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, inviteBrokerRequestSchema)
  const result = await teamContainer.inviteBrokerUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    name: body.name,
    email: body.email,
    locale: body.locale,
  })

  return NextResponse.json(result, { status: 201 })
})
