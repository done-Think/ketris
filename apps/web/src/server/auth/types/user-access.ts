export type TenantAccessStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELED'

export type TenantAccountType = 'INDIVIDUAL' | 'BROKER' | 'AGENCY'

export interface UserAccessState {
  tenantAccountType?: TenantAccountType
  /** CNPJ, digits only, of the company that owns the tenant. */
  tenantCnpj?: string | null
  tenantName?: string
  tenantSlug?: string
  tenantStatus?: TenantAccessStatus
  emailVerifiedAt?: Date | null
  sessionVersion?: number
}
