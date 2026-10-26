import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import {
  createMaintenanceProviderRequestSchema,
  listMaintenanceProvidersQuerySchema,
} from '@server/maintenance/schemas/maintenance-provider.schema'
import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireMaintenanceActor(request)
  const query = parseQuery(request, listMaintenanceProvidersQuerySchema)
  return NextResponse.json(
    await maintenanceContainer.listMaintenanceProvidersUseCase.execute({ ...actor, ...query }),
  )
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireMaintenanceActor(request)
  const body = await parseJsonBody(request, createMaintenanceProviderRequestSchema)
  const provider = await maintenanceContainer.createMaintenanceProviderUseCase.execute({
    ...actor,
    ...body,
  })
  return NextResponse.json({ provider }, { status: 201 })
})
