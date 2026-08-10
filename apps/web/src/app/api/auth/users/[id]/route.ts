import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { updateUserRequestSchema } from '@server/auth/schemas/update-user.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: { id: string }
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const user = await authContainer.getUserUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    userId: context.params.id,
  })

  return NextResponse.json({ user }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, updateUserRequestSchema)

  const user = await authContainer.updateUserUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    userId: context.params.id,
    nome: body.nome,
    email: body.email,
    papel: body.papel,
  })

  return NextResponse.json({ user }, { status: 200 })
})

export const DELETE = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const user = await authContainer.deactivateUserUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    userId: context.params.id,
  })

  return NextResponse.json({ user }, { status: 200 })
})
