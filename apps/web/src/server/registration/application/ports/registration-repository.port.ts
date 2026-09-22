import type { User } from '@server/auth/domain/user.entity'
import type { TenantSummary } from '@server/platform/domain/tenant-summary.entity'

export interface NewTenantWithAdmin {
  tenantName: string
  adminName: string
  email: string
  senhaHash: string
}

export interface RegistrationRepository {
  createTenantWithAdmin(input: NewTenantWithAdmin): Promise<{ tenant: TenantSummary; user: User }>
}
