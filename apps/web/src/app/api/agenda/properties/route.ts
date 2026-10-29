import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { agendaContainer } from '@server/agenda/container'
import { listAgendaPropertiesQuerySchema } from '@server/agenda/schemas/agenda-property.schema'
import { parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const query = parseQuery(request, listAgendaPropertiesQuerySchema)
  const page = await agendaContainer.listAgendaPropertiesUseCase.execute({
    ...query,
    actorTenantId: actor.tenantId,
    actorUserId: actor.sub,
    actorRole: actor.role,
  })
  return NextResponse.json(page)
})
