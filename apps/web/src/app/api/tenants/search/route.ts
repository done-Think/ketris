import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { registrationContainer } from '@server/registration/container'
import { searchTenantsQuerySchema } from '@server/registration/schemas/search-tenants.schema'
import { parseQuery, withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = parseQuery(request, searchTenantsQuerySchema)

  const tenants = await registrationContainer.searchRegisterableTenantsUseCase.execute({
    query: query.q,
  })

  return NextResponse.json(
    { tenants: tenants.map((tenant) => ({ id: tenant.id, name: tenant.name })) },
    { status: 200 },
  )
})
