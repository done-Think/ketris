import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'
import { teamContainer } from '@server/team/container'
import { toTeamTransferResponse } from '@server/team/domain/team-response'
import {
  teamMemberIdParamsSchema,
  transferBrokerPortfolioRequestSchema,
} from '@server/team/schemas/team.schema'
import type { TeamMemberRouteContext } from '@server/team/types/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: TeamMemberRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, teamMemberIdParamsSchema)
    const body = await parseJsonBody(request, transferBrokerPortfolioRequestSchema)
    const result = await teamContainer.transferBrokerPortfolioUseCase.execute({
      actorId: actor.sub,
      actorTenantId: actor.tenantId,
      actorPapel: actor.papel,
      brokerId: id,
      destinationId: body.destinationId,
      items: { properties: body.properties, leads: body.leads, futureEvents: body.futureEvents },
    })

    return NextResponse.json({ transferred: toTeamTransferResponse(result) }, { status: 200 })
  },
)
