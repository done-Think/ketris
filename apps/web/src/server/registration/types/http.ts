import type { z } from 'zod'
import type { searchTenantsQuerySchema } from '../schemas/search-tenants.schema'
import type { registerRequestSchema, registerResponseSchema } from '../schemas/register.schema'

export type RegisterRequestDTO = z.input<typeof registerRequestSchema>
export type RegisterResponseDTO = z.infer<typeof registerResponseSchema>

export type SearchTenantsQueryDTO = z.infer<typeof searchTenantsQuerySchema>
