import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { createAdminRequestSchema } from '@server/auth/schemas/create-admin.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createAdminRequestSchema)

  const user = await authContainer.createAdminUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    nome: body.nome,
    email: body.email,
    password: body.password,
  })

  return NextResponse.json({ user }, { status: 201 })
})

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const admins = await authContainer.listAdminsUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
  })

  return NextResponse.json({ admins }, { status: 200 })
})
