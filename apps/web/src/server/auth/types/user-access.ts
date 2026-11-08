export type TenantAccessStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELED'

export type TenantAccountType = 'INDIVIDUAL' | 'BROKER' | 'AGENCY'

export interface UserAccessState {
  tenantAccountType?: TenantAccountType
  tenantName?: string
  tenantSlug?: string
  tenantStatus?: TenantAccessStatus
  emailVerifiedAt?: Date | null
  sessionVersion?: number
}
