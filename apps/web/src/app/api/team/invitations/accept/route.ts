import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'
import { teamContainer } from '@server/team/container'
import {
  acceptTeamInvitationRequestSchema,
  teamInvitationTokenQuerySchema,
} from '@server/team/schemas/team.schema'

export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { token } = parseQuery(request, teamInvitationTokenQuerySchema)
  const invitation = await teamContainer.getTeamInvitationUseCase.execute(token)

  return NextResponse.json({ invitation }, { status: 200, headers: noStore })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, acceptTeamInvitationRequestSchema)
  const accepted = await teamContainer.acceptTeamInvitationUseCase.execute(body)

  return NextResponse.json({ email: accepted.email }, { status: 200, headers: noStore })
})
