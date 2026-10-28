import type { z } from 'zod'

import type {
  createPlatformAdminRequestSchema,
  createPlatformAdminResponseSchema,
} from '../schemas/create-platform-admin.schema'
import type {
  createTenantAdminRequestSchema,
  createTenantAdminResponseSchema,
} from '../schemas/create-tenant-admin.schema'
import type { createTenantRequestSchema } from '../schemas/create-tenant.schema'
import type { loginPlatformRequestSchema } from '../schemas/login-platform.schema'
import type { refreshPlatformTokenRequestSchema } from '../schemas/refresh-platform-token.schema'
import type { updatePlatformAdminRequestSchema } from '../schemas/update-platform-admin.schema'
import type { updatePlatformPlanRequestSchema } from '../schemas/platform-plan.schema'
import type { updateTenantAccountRequestSchema } from '../schemas/update-tenant-account.schema'

export type CreatePlatformAdminRequestDTO = z.infer<typeof createPlatformAdminRequestSchema>

export type CreateTenantAdminRequestDTO = z.infer<typeof createTenantAdminRequestSchema>

export type CreateTenantAdminResponseDTO = z.infer<typeof createTenantAdminResponseSchema>
export type CreatePlatformAdminResponseDTO = z.infer<typeof createPlatformAdminResponseSchema>

export type CreateTenantRequestDTO = z.infer<typeof createTenantRequestSchema>

export type LoginPlatformRequestDTO = z.infer<typeof loginPlatformRequestSchema>

export type UpdatePlatformPlanRequestDTO = z.infer<typeof updatePlatformPlanRequestSchema>

export type RefreshPlatformTokenRequestDTO = z.infer<typeof refreshPlatformTokenRequestSchema>

export type UpdatePlatformAdminRequestDTO = z.infer<typeof updatePlatformAdminRequestSchema>

export type UpdateTenantAccountRequestDTO = z.infer<typeof updateTenantAccountRequestSchema>

export interface PlatformIdRouteContext {
  params: Promise<{ id: string }>
}

export interface PlatformAccountTypeRouteContext {
  params: Promise<{ accountType: string }>
}
