import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'
import { teamContainer } from '@server/team/container'
import { toTeamGoalChangeResponse } from '@server/team/domain/team-response'
import {
  setBrokerGoalRequestSchema,
  teamMemberIdParamsSchema,
} from '@server/team/schemas/team.schema'
import type { TeamMemberRouteContext } from '@server/team/types/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: TeamMemberRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, teamMemberIdParamsSchema)
    const goals = await teamContainer.listBrokerGoalsUseCase.execute({
      actorId: actor.sub,
      actorTenantId: actor.tenantId,
      actorRole: actor.role,
      brokerId: id,
    })

    return NextResponse.json({ goals: goals.map(toTeamGoalChangeResponse) }, { status: 200 })
  },
)

export const PUT = withErrorHandling(
  async (request: NextRequest, context: TeamMemberRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, teamMemberIdParamsSchema)
    const body = await parseJsonBody(request, setBrokerGoalRequestSchema)
    const goal = await teamContainer.setBrokerGoalUseCase.execute({
      actorId: actor.sub,
      actorTenantId: actor.tenantId,
      actorRole: actor.role,
      brokerId: id,
      monthlySales: body.monthlySales,
    })

    return NextResponse.json({ goal: toTeamGoalChangeResponse(goal) }, { status: 200 })
  },
)
