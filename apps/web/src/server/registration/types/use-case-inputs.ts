import type { TenantOwnerProfile } from './account'

export interface RegistrationDetailsInput {
  fullName: string
  email: string
  password: string
  phone: string
  acceptTerms: boolean
}

export type RegisterRenterInput = RegistrationDetailsInput

export interface RegisterTenantAgentInput extends RegistrationDetailsInput {
  agencyId: string
  creci: string
}

export interface RegisterTenantOwnerInput extends RegistrationDetailsInput {
  profile: TenantOwnerProfile
  companyName?: string
  creci?: string
}

export interface SearchRegisterableTenantsInput {
  query: string
}
