import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { toAuthenticatedUserResponse } from '@server/auth/application/user-response'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { createUserRequestSchema } from '@server/auth/schemas/create-user.schema'
import { listUsersQuerySchema } from '@server/auth/schemas/list-users.schema'
import { parseQuery, parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createUserRequestSchema)

  const user = await authContainer.createUserUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    nome: body.name,
    email: body.email,
    password: body.password,
    papel: body.role,
  })

  return NextResponse.json({ user: toAuthenticatedUserResponse(user) }, { status: 201 })
})

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const query = parseQuery(request, listUsersQuerySchema)
  const result = await authContainer.listUsersUseCase.execute({
    ...query,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
  })

  return NextResponse.json(
    { ...result, users: result.users.map(toAuthenticatedUserResponse) },
    { status: 200 },
  )
})
