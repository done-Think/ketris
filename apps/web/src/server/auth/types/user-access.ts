export type TenantAccessStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELED'

export interface UserAccessState {
  tenantName?: string
  tenantSlug?: string
  tenantStatus?: TenantAccessStatus
  emailVerifiedAt?: Date | null
  sessionVersion?: number
}
