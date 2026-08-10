import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { updateAdminRequestSchema } from '@server/auth/schemas/update-admin.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: { id: string }
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const admin = await authContainer.getAdminUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    adminId: context.params.id,
  })

  return NextResponse.json({ admin }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, updateAdminRequestSchema)

  const admin = await authContainer.updateAdminUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    adminId: context.params.id,
    nome: body.nome,
    email: body.email,
  })

  return NextResponse.json({ admin }, { status: 200 })
})

export const DELETE = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const admin = await authContainer.deactivateAdminUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    adminId: context.params.id,
  })

  return NextResponse.json({ admin }, { status: 200 })
})
