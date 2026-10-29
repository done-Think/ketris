import type {
  RegistrationAccountType,
  RegistrationTenantStatus,
  TenantOwnerProfile,
} from '../types/account'
export type { TenantOwnerProfile } from '../types/account'

const ACCOUNT_TYPE_BY_PROFILE: Record<TenantOwnerProfile, RegistrationAccountType> = {
  owner: 'INDIVIDUAL',
  broker: 'BROKER',
  agency: 'AGENCY',
  developer: 'AGENCY',
}

export const SELF_REGISTERED_TENANT_STATUS: RegistrationTenantStatus = 'TRIAL'

export function accountTypeForProfile(profile: TenantOwnerProfile): RegistrationAccountType {
  return ACCOUNT_TYPE_BY_PROFILE[profile]
}
