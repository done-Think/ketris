import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'
import { teamContainer } from '@server/team/container'
import { teamMemberIdParamsSchema } from '@server/team/schemas/team.schema'
import type { TeamMemberRouteContext } from '@server/team/types/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: TeamMemberRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, teamMemberIdParamsSchema)
    await teamContainer.activateBrokerUseCase.execute({
      actorId: actor.sub,
      actorTenantId: actor.tenantId,
      actorRole: actor.role,
      brokerId: id,
    })

    return new NextResponse(null, { status: 204 })
  },
)
