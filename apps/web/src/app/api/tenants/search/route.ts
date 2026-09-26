import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { registrationContainer } from '@server/registration/container'
import { searchTenantsQuerySchema } from '@server/registration/schemas/search-tenants.schema'
import { RequestValidationError, withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const rawQuery = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = searchTenantsQuerySchema.safeParse(rawQuery)

  if (!parsed.success) {
    throw new RequestValidationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    )
  }

  const tenants = await registrationContainer.searchRegisterableTenantsUseCase.execute({
    query: parsed.data.q,
  })

  return NextResponse.json(
    { tenants: tenants.map((tenant) => ({ id: tenant.id, name: tenant.nome })) },
    { status: 200 },
  )
})
