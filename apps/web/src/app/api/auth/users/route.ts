import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { createUserRequestSchema } from '@server/auth/schemas/create-user.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createUserRequestSchema)

  const user = await authContainer.createUserUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    nome: body.nome,
    email: body.email,
    password: body.password,
    papel: body.papel,
  })

  return NextResponse.json({ user }, { status: 201 })
})
