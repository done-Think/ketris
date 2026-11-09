export type RegistrationAccountType = 'INDIVIDUAL' | 'BROKER' | 'AGENCY'
export type RegistrationTenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED'
export type TenantOwnerProfile = 'owner' | 'broker' | 'agency' | 'developer' | 'condoManager'

export interface RegistrationTenant {
  id: string
  name: string
  slug: string
  accountType: RegistrationAccountType
  status: RegistrationTenantStatus
  createdAt: Date
}

export interface RegistrationAccount {
  id: string
  tenantId: string
  email: string
}

export interface RegistrationContactInput {
  phone: string
  creci?: string
  /** CPF, digits only, of the person behind an individual account. */
  cpf?: string
  /** CPF or CNPJ, digits only, of a broker; replaces `cpf` when present. */
  document?: string
  /** CNPJ, digits only, of the company that owns a new tenant. */
  cnpj?: string
  termsAcceptedAt: Date
  createBrokerProfile: boolean
}

export interface NewTenantWithAdmin extends RegistrationContactInput {
  tenantName: string
  adminName: string
  email: string
  passwordHash: string
  accountType: RegistrationAccountType
  status: RegistrationTenantStatus
}

export interface NewRegistrationMember extends RegistrationContactInput {
  tenantId: string
  name: string
  email: string
  passwordHash: string
  role: 'AGENT' | 'RENTER'
  pendingApproval: boolean
}

export interface PendingRegistrationOutput {
  email: string
  tenantId: string
  pendingApproval: boolean
}
