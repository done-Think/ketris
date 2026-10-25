export type RegistrationAccountType = 'INDIVIDUAL' | 'BROKER' | 'AGENCY'
export type RegistrationTenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED'
export type TenantOwnerProfile = 'proprietario' | 'corretor' | 'imobiliaria' | 'construtora'

export interface RegistrationTenant {
  id: string
  nome: string
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
  telefone: string
  creci?: string
  termosAceitosEm: Date
  createBrokerProfile: boolean
}

export interface NewTenantWithAdmin extends RegistrationContactInput {
  tenantName: string
  adminName: string
  email: string
  senhaHash: string
  accountType: RegistrationAccountType
  status: RegistrationTenantStatus
}

export interface NewRegistrationMember extends RegistrationContactInput {
  tenantId: string
  nome: string
  email: string
  senhaHash: string
  papel: 'AGENT' | 'RENTER'
  pendingApproval: boolean
}

export interface PendingRegistrationOutput {
  email: string
  tenantId: string
  pendingApproval: boolean
}
