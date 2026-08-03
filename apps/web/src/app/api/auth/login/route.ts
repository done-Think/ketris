import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { loginRequestSchema } from '@server/auth/schemas/login.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

// POST /api/auth/login — Route Handler fino: valida (Zod) -> chama o use-case -> serializa resposta.
// Nenhuma regra de negócio aqui; ver `server/auth/application/use-cases/login.use-case.ts`.
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, loginRequestSchema)

  const { user, accessToken } = await authContainer.loginUseCase.execute({
    email: body.email,
    password: body.password,
  })

  return NextResponse.json({ user, accessToken }, { status: 200 })
})
