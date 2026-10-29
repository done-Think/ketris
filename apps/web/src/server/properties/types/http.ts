import type { z } from 'zod'

import type {
  createPropertyRequestSchema,
  updatePropertyRequestSchema,
  listPropertiesQuerySchema,
} from '../schemas/property-input.schema'

export type CreatePropertyRequestDTO = z.infer<typeof createPropertyRequestSchema>
export type UpdatePropertyRequestDTO = z.infer<typeof updatePropertyRequestSchema>
export type ListPropertiesQueryDTO = z.infer<typeof listPropertiesQuerySchema>

export interface PropertyRouteContext {
  params: Promise<{ id: string }>
}

export interface PropertyMediaRouteContext {
  params: Promise<{ key: string[] }>
}
