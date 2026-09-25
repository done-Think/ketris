import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { toAuthenticatedUserResponse, type Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { createUserRequestSchema } from '@server/auth/schemas/create-user.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createUserRequestSchema)

  const user = await authContainer.createUserUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    nome: body.name,
    email: body.email,
    password: body.password,
    papel: body.role,
  })

  return NextResponse.json({ user: toAuthenticatedUserResponse(user) }, { status: 201 })
})

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const users = await authContainer.listUsersUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
  })

  return NextResponse.json({ users: users.map(toAuthenticatedUserResponse) }, { status: 200 })
})
