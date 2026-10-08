export interface TenantSummary {
  id: string
  nome: string
  slug: string
  createdAt: string
}

export type TenantUserPapel = 'ADMIN' | 'OWNER' | 'AGENT' | 'RENTER'

export interface TenantUser {
  id: string
  tenantId: string
  nome: string
  email: string
  papel: TenantUserPapel
  ativo: boolean
}

export interface CreateTenantPayload {
  nome: string
  slug: string
}

export interface CreateTenantAdminPayload {
  nome: string
  email: string
  password: string
}

export interface ListTenantsResponse {
  tenants: TenantSummary[]
}

export interface CreateTenantResponse {
  tenant: TenantSummary
}

export interface ListTenantUsersResponse {
  users: TenantUser[]
}

export interface CreateTenantAdminResponse {
  user: TenantUser
}

export type TenantUsersListProps = {
  tenantId: string
}

export type CreateTenantAdminFormProps = {
  tenantId: string
}

export interface CreateTenantInput {
  nome: string
  slug: string
}

export interface CreateTenantAdminInput {
  tenantId: string
  nome: string
  email: string
  password: string
}
