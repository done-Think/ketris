import type { TenantAccountType, TenantStatus } from '@server/platform/domain/tenant-account'

// Sign-up profiles that create their own tenant (an agency's broker or a renter joins one instead).
export type TenantOwnerProfile = 'proprietario' | 'corretor' | 'imobiliaria' | 'construtora'

// There is no builder plan yet, so a construtora is billed as an agency until the platform admin
// reclassifies it on the tenant screen.
const ACCOUNT_TYPE_BY_PROFILE: Record<TenantOwnerProfile, TenantAccountType> = {
  proprietario: 'INDIVIDUAL',
  corretor: 'BROKER',
  imobiliaria: 'AGENCY',
  construtora: 'AGENCY',
}

// A self-registered tenant has not paid anything yet: it starts in trial, outside the MRR and the
// churn base, until the platform admin activates it.
export const SELF_REGISTERED_TENANT_STATUS: TenantStatus = 'TRIAL'

export function accountTypeForProfile(profile: TenantOwnerProfile): TenantAccountType {
  return ACCOUNT_TYPE_BY_PROFILE[profile]
}
